import { createDebug, splitFirst, tinyassert } from "@hiogawa/utils";
import { createMemoryHistory } from "@tanstack/history";
import reactDomServer from "react-dom/server.edge";
import type { ModuleNode, ViteDevServer } from "vite";
import { LayoutRoot, LayoutStateContext } from "../features/router/client";
import type { ServerRouterData } from "../features/router/utils";
import {
  createModuleMap,
  initializeWebpackSsr,
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
import {
  ENTRY_REACT_SERVER_WRAPPER,
  type SsrAssetsType,
  invalidateModule,
} from "../plugin/utils";
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
  initializeWebpackSsr();

  const { default: reactServerDomClient } = await import(
    "react-server-dom-webpack/client.edge"
  );

  //
  // ssr root
  //

  if (import.meta.env.DEV) {
    ssrImportPromiseCache.clear();
  }

  const [stream1, stream2] = result.stream.tee();

  const layoutPromise =
    reactServerDomClient.createFromReadableStream<ServerRouterData>(stream1, {
      ssrManifest: {
        moduleMap: createModuleMap(),
        moduleLoading: null,
      },
    });

  const url = new URL(request.url);
  const history = createMemoryHistory({
    initialEntries: [url.href.slice(url.origin.length)],
  });
  const router = new Router(history);

  const reactRootEl = (
    <RouterContext.Provider value={router}>
      <LayoutStateContext.Provider value={{ data: layoutPromise }}>
        <LayoutRoot />
      </LayoutStateContext.Provider>
    </RouterContext.Provider>
  );

  //
  // render
  //

  if (import.meta.env.DEV) {
    // ensure latest css
    invalidateModule($__global.dev.server, "\0virtual:react-server-css.js");
    invalidateModule($__global.dev.server, "\0virtual:dev-ssr-css.css?direct");
  }
  const assets: SsrAssetsType = (await import("virtual:ssr-assets" as string))
    .default;

  // inject DEBUG variable
  if (globalThis?.process?.env?.["DEBUG"]) {
    assets.head += `<script>globalThis.__DEBUG = "${process.env["DEBUG"]}"</script>\n`;
  }

  // two pass SSR to re-render on error
  let ssrStream: ReadableStream<Uint8Array>;
  let status = 200;
  try {
    ssrStream = await reactDomServer.renderToReadableStream(reactRootEl, {
      // @ts-expect-error no type yet
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
    ssrStream = await reactDomServer.renderToReadableStream(errorRoot, {
      bootstrapModules: assets.bootstrapModules,
    });
  }

  const htmlStream = ssrStream
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(injectToHead(assets.head))
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
