import { createDebug, splitFirst, tinyassert } from "@hiogawa/utils";
import { createMemoryHistory } from "@tanstack/history";
import ReactDOMServer from "react-dom/server.edge";
import ReactDOMStatic from "react-dom/static.edge";
import type { ModuleNode, ViteDevServer } from "vite";
import type { SsrAssetsType } from "../features/assets/plugin";
import { DEV_SSR_CSS, SERVER_CSS_PROXY } from "../features/assets/shared";
import {
  LayoutRoot,
  LayoutStateContext,
  RouteAssetLinks,
  RouteManifestContext,
} from "../features/router/client";
import type { RouteManifest } from "../features/router/manifest";
import type { ServerRouterData } from "../features/router/utils";
import {
  createModuleMap,
  initializeReactClientSsr,
  ssrImportPromiseCache,
} from "../features/use-client/server";
import { Router, RouterContext } from "../lib/client/router";
import {
  DEFAULT_ERROR_CONTEXT,
  getErrorContext,
  getStatusText,
  isRedirectError,
} from "../lib/error";
import { $__global } from "../lib/global";
import { ENTRY_REACT_SERVER_WRAPPER, invalidateModule } from "../plugin/utils";
import { escpaeScriptString } from "../utils/escape";
import { jsonStringifyTransform } from "../utils/stream";
import { injectStreamScript } from "../utils/stream-script";
import type { ReactServerHandlerStreamResult } from "./react-server";

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

  const response = await renderHtml(request, result);
  const html = await response.text();
  return { stream, response, html };
}

export async function importReactServer(): Promise<
  typeof import("./react-server")
> {
  if (import.meta.env.DEV) {
    return $__global.dev.reactServer.ssrLoadModule(
      ENTRY_REACT_SERVER_WRAPPER,
    ) as any;
  } else {
    return import("/dist/rsc/index.js" as string);
  }
}

export async function renderHtml(
  request: Request,
  result: ReactServerHandlerStreamResult,
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

  const layoutPromise = ReactClient.createFromReadableStream<ServerRouterData>(
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

  const routeManifest = await importRouteManifest();

  const reactRootEl = (
    <RouterContext.Provider value={router}>
      <LayoutStateContext.Provider value={{ data: layoutPromise }}>
        <RouteManifestContext.Provider value={routeManifest}>
          <RouteAssetLinks />
          <LayoutRoot />
        </RouteManifestContext.Provider>
      </LayoutStateContext.Provider>
    </RouterContext.Provider>
  );

  if (1) {
    async function streamToString(stream: ReadableStream<Uint8Array>) {
      let result = "";
      await stream.pipeThrough(new TextDecoderStream()).pipeTo(
        new WritableStream({
          write(chunk) {
            result += chunk;
          },
        }),
      );
      return result;
    }

    (async () => {
      const result = await ReactDOMStatic.prerender(reactRootEl);
      console.log("[postponed]", result.postponed);
      console.log("[prelude]", await streamToString(result.prelude));
    })();
  }

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
    head += `<script>globalThis.__DEBUG = "${process.env["DEBUG"]}"</script>\n`;
  }

  // TODO: too huge?
  head += `<script>globalThis.__routeManifest = ${escpaeScriptString(
    JSON.stringify(routeManifest),
  )}</script>\n`;

  // two pass SSR to re-render on error
  let ssrStream: ReadableStream<Uint8Array>;
  let status = 200;
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
  } catch (e) {
    const ctx = getErrorContext(e) ?? DEFAULT_ERROR_CONTEXT;
    if (isRedirectError(ctx)) {
      return new Response(null, { status: ctx.status, headers: ctx.headers });
    }
    status = ctx.status;
    // render empty as error fallback and
    // let browser render full CSR instead of hydration
    // which will replay client error boudnary from RSC error
    // TODO: proper two-pass SSR with error route tracking?
    // TODO: meta tag system
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
    .pipeThrough(injectToHead(head))
    .pipeThrough(
      injectStreamScript(
        stream2
          .pipeThrough(new TextDecoderStream())
          .pipeThrough(jsonStringifyTransform()),
      ),
    )
    .pipeThrough(new TextEncoderStream());

  return new Response(htmlStream, {
    status,
    headers: {
      ...result.actionResult?.responseHeaders,
      "content-type": "text/html",
    },
  });
}

function injectToHead(data: string) {
  const marker = "<head>";
  let done = false;
  return new TransformStream<string, string>({
    transform(chunk, controller) {
      if (!done && chunk.includes(marker)) {
        const [pre, post] = splitFirst(chunk, marker);
        controller.enqueue(pre + marker + data + post);
        done = true;
        return;
      }
      controller.enqueue(chunk);
    },
  });
}

async function importRouteManifest(): Promise<RouteManifest> {
  if (import.meta.env.DEV) {
    return { routeTree: {} };
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
