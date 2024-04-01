import { createDebug, splitFirst } from "@hiogawa/utils";
import { createMemoryHistory } from "@tanstack/history";
import reactDomServer from "react-dom/server.edge";
import {
  LayoutManager,
  LayoutManagerContext,
  LayoutRoot,
  LayoutStateContext,
  flattenLayoutMapPromise,
} from "../features/router/layout-manager";
import type { ServerLayoutData } from "../features/router/utils";
import {
  createModuleMap,
  initializeWebpackSsr,
  ssrImportPromiseCache,
} from "../features/use-client/server";
import { Router, RouterContext } from "../lib/client/router";
import { getErrorContext, getStatusText } from "../lib/error";
import { __global } from "../lib/global";
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
  const reactServer = await importReactServer();

  // server action and render rsc stream
  const result = await reactServer.handler({ request });
  if (result instanceof Response) {
    return result;
  }

  // render rsc stream into html
  const ssrResult = await renderHtml(request, result);
  return new Response(ssrResult.htmlStream, {
    status: ssrResult.status,
    headers: {
      "content-type": "text/html, charset=utf-8",
    },
  });
}

export async function importReactServer(): Promise<
  typeof import("./react-server")
> {
  if (import.meta.env.DEV) {
    return __global.dev.reactServer.ssrLoadModule(
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
    reactServerDomClient.createFromReadableStream<ServerLayoutData>(stream1, {
      ssrManifest: {
        moduleMap: createModuleMap(),
        moduleLoading: null,
      },
    });

  // const clientLayoutMap = flattenLayoutMapPromise(
  //   Object.keys(result.layoutRequest),
  //   layoutPromise,
  // );

  const layoutManager = new LayoutManager();
  // layoutManager.update(clientLayoutMap);

  const url = new URL(request.url);
  const history = createMemoryHistory({
    initialEntries: [url.href.slice(url.origin.length)],
  });
  const router = new Router(history);

  const reactRootEl = (
    <RouterContext.Provider value={router}>
      <LayoutManagerContext.Provider value={layoutManager}>
        <LayoutStateContext.Provider value={{ data: layoutPromise }}>
          <LayoutRoot />
        </LayoutStateContext.Provider>
      </LayoutManagerContext.Provider>
    </RouterContext.Provider>
  );

  //
  // render
  //

  if (import.meta.env.DEV) {
    // ensure latest css
    invalidateModule(__global.dev.server, "\0virtual:ssr-assets");
    invalidateModule(__global.dev.server, "\0virtual:react-server-css.js");
    invalidateModule(__global.dev.server, "\0virtual:dev-ssr-css.css?direct");
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
      bootstrapModules: url.search.includes("__noJs")
        ? []
        : assets.bootstrapModules,
      onError(error, errorInfo) {
        // TODO: should handle SSR error which is not RSC error?
        debug("renderToReadableStream", { error, errorInfo });
      },
    });
  } catch (e) {
    // render empty as error fallback and
    // let browser render full CSR instead of hydration
    // which will replay client error boudnary from RSC error
    // TODO: proper two-pass SSR with error route tracking?
    // TODO: meta tag system
    status = getErrorContext(e)?.status ?? 500;
    const errorRoot = (
      <html data-no-hydate>
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

  return { htmlStream, status };
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
