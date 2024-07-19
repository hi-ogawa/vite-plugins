import { createDebug, tinyassert } from "@hiogawa/utils";
import { createMemoryHistory } from "@tanstack/history";
import ReactDOMServer from "react-dom/server.edge";
import type { ModuleNode, ViteDevServer } from "vite";
import type { SsrAssetsType } from "../features/assets/plugin";
import { DEV_SSR_CSS, SERVER_CSS_PROXY } from "../features/assets/shared";
import {
  createModuleMap,
  initializeReactClientSsr,
  ssrImportPromiseCache,
} from "../features/client-component/ssr";
import {
  DEFAULT_ERROR_CONTEXT,
  getErrorContext,
  getStatusText,
  isRedirectError,
} from "../features/error/shared";
import {
  createSsrContext,
  injectDefaultMetaViewport,
} from "../features/next/ssr";
import {
  FlightDataContext,
  LayoutRoot,
  RouteAssetLinks,
  RouteManifestContext,
} from "../features/router/client";
import { Router, RouterContext } from "../features/router/client/router";
import {
  type RouteManifest,
  emptyRouteManifest,
} from "../features/router/manifest";
import type { FlightData } from "../features/router/utils";
import { $__global } from "../global";
import { ENTRY_SERVER_WRAPPER, invalidateModule } from "../plugin/utils";
import {
  createBufferedTransformStream,
  injectFlightStream,
} from "../utils/stream-script";
import type { ReactServerHandlerStreamResult } from "./server";

const debug = createDebug("react-server:ssr");

export async function handler(request: Request): Promise<Response> {
  // dev only api endpoint to test internal
  if (
    import.meta.env.DEV &&
    new URL(request.url).pathname === "/__react_server_dev"
  ) {
    return devInspectHandler(request);
  }

  const reactServer = await importReactServer();

  // server action and render rsc stream
  const result = await reactServer.handler({ request });
  if (result instanceof Response) {
    return result;
  }

  // render rsc stream into html (or redirect)
  return renderHtml(request, result);
}

// return stream and ssr at once for prerender
export async function prerender(request: Request) {
  const reactServer = await importReactServer();

  const result = await reactServer.handler({ request });
  tinyassert(!(result instanceof Response));

  const [stream, stream2] = result.stream.tee();
  result.stream = stream2;

  const response = await renderHtml(request, result, { prerender: true });
  const html = await response.text();
  return { stream, response, html };
}

export async function importReactServer(): Promise<typeof import("./server")> {
  if (import.meta.env.DEV) {
    return $__global.dev.reactServer.ssrLoadModule(ENTRY_SERVER_WRAPPER) as any;
  } else {
    return import("/dist/rsc/index.js" as string);
  }
}

export async function renderHtml(
  request: Request,
  result: ReactServerHandlerStreamResult,
  opitons?: { prerender?: boolean },
) {
  initializeReactClientSsr();

  const { default: ReactClient } = await import(
    "react-server-dom-webpack/client.edge"
  );

  //
  // ssr root
  //

  if (import.meta.env.DEV) {
    ssrImportPromiseCache.clear();
  }

  const [stream1, stream2] = result.stream.tee();

  const flightDataPromise = ReactClient.createFromReadableStream<FlightData>(
    stream1,
    {
      ssrManifest: {
        moduleMap: createModuleMap(),
        moduleLoading: null,
      },
    },
  );

  const url = new URL(request.url);
  const history = createMemoryHistory({
    initialEntries: [url.href.slice(url.origin.length)],
  });
  const router = new Router(history);

  const { routeManifestUrl, routeManifest } = await importRouteManifest();

  const ssrContext = createSsrContext();

  const reactRootEl = (
    <RouterContext.Provider value={router}>
      <FlightDataContext.Provider value={flightDataPromise}>
        <RouteManifestContext.Provider value={routeManifest}>
          <RouteAssetLinks />
          <ssrContext.Provider>
            <LayoutRoot />
          </ssrContext.Provider>
        </RouteManifestContext.Provider>
      </FlightDataContext.Provider>
    </RouterContext.Provider>
  );

  //
  // render
  //

  if (import.meta.env.DEV) {
    // ensure latest css
    invalidateModule($__global.dev.server, `\0${SERVER_CSS_PROXY}`);
    invalidateModule($__global.dev.server, `\0${DEV_SSR_CSS}?direct`);
  }
  const assets: SsrAssetsType = (await import("virtual:ssr-assets" as string))
    .default;
  let head = assets.head;

  // inject DEBUG variable
  if (globalThis?.process?.env?.["DEBUG"]) {
    head += `<script>self.__DEBUG = "${process.env["DEBUG"]}"</script>\n`;
  }

  if (routeManifestUrl) {
    head += `<script>self.__routeManifestUrl = "${routeManifestUrl}"</script>\n`;
    head += `<link rel="modulepreload" href="${routeManifestUrl}" />\n`;
  }

  // two pass SSR to re-render on error
  let ssrStream: ReactDOMServer.ReactDOMServerReadableStream;
  let status = result.status;
  try {
    ssrStream = await ReactDOMServer.renderToReadableStream(reactRootEl, {
      formState: result.actionResult?.data,
      bootstrapModules: url.search.includes("__nojs")
        ? []
        : assets.bootstrapModules,
      onError(error, errorInfo) {
        debug("renderToReadableStream", { error, errorInfo });
        if (!getErrorContext(error)) {
          console.error("[react-dom:renderToReadableStream]", error);
        }
      },
    });
    if (opitons?.prerender) {
      await ssrStream.allReady;
    }
  } catch (e) {
    const ctx = getErrorContext(e) ?? DEFAULT_ERROR_CONTEXT;
    if (isRedirectError(ctx)) {
      return result.requestContext.injectResponseHeaders(
        new Response(null, {
          status: ctx.status,
          headers: ctx.headers,
        }),
      );
    }
    status = ctx.status;
    // render empty as error fallback and
    // let browser render full CSR instead of hydration
    // which will replay client error boudnary from RSC error
    const errorRoot = (
      <html data-no-hydrate>
        <head>
          <meta charSet="utf-8" />
        </head>
        <body>
          <noscript>
            {status} {getStatusText(status)}
          </noscript>
        </body>
      </html>
    );
    ssrStream = await ReactDOMServer.renderToReadableStream(errorRoot, {
      bootstrapModules: assets.bootstrapModules,
    });
  }

  const htmlStream = ssrStream
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(createBufferedTransformStream())
    .pipeThrough(injectToHead(() => head + ssrContext.render()))
    .pipeThrough(injectDefaultMetaViewport())
    .pipeThrough(injectFlightStream(stream2))
    .pipeThrough(new TextEncoderStream());

  return new Response(htmlStream, {
    status,
    headers: {
      ...result.requestContext.getResponseHeaders(),
      "content-type": "text/html;charset=utf-8",
    },
  });
}

function injectToHead(getData: () => string) {
  // need to inject last to avoid hydration mismatch
  // when manually rendering head inline script in react
  const marker = "</head>";
  let done = false;
  return new TransformStream<string, string>({
    transform(chunk, controller) {
      if (!done && chunk.includes(marker)) {
        const [pre, post] = chunk.split(marker);
        controller.enqueue(pre + getData() + marker + post);
        done = true;
        return;
      }
      controller.enqueue(chunk);
    },
  });
}

async function importRouteManifest(): Promise<{
  routeManifestUrl?: string;
  routeManifest: RouteManifest;
}> {
  if (import.meta.env.DEV) {
    return { routeManifest: emptyRouteManifest() };
  } else {
    const mod = await import("virtual:route-manifest" as string);
    return mod.default;
  }
}

//#region debug dev module graph

async function devInspectHandler(request: Request) {
  tinyassert(request.method === "POST");
  const data = await request.json();
  if (data.type === "module") {
    let mod: ModuleNode | undefined;
    if (data.environment === "ssr") {
      mod = await getModuleNode($__global.dev.server, data.url, true);
    }
    if (data.environment === "react-server") {
      mod = await getModuleNode($__global.dev.reactServer, data.url, true);
    }
    const result = mod && {
      id: mod.id,
      lastInvalidationTimestamp: mod.lastInvalidationTimestamp,
      importers: [...(mod.importers ?? [])].map((m) => m.id),
      ssrImportedModules: [...(mod.ssrImportedModules ?? [])].map((m) => m.id),
      clientImportedModules: [...(mod.clientImportedModules ?? [])].map(
        (m) => m.id,
      ),
    };
    return new Response(JSON.stringify(result || false, null, 2), {
      headers: { "content-type": "application/json" },
    });
  }
  tinyassert(false);
}

async function getModuleNode(server: ViteDevServer, url: string, ssr: boolean) {
  const resolved = await server.moduleGraph.resolveUrl(url, ssr);
  return server.moduleGraph.getModuleById(resolved[1]);
}

//#endregion

declare module "react-dom/server" {
  interface RenderToReadableStreamOptions {
    formState?: unknown;
  }
}
