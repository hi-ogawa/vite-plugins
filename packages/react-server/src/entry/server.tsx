import { splitFirst } from "@hiogawa/utils";
import reactDomServer from "react-dom/server.edge";
import { injectRSCPayload } from "rsc-html-stream/server";
import { getErrorStatus } from "..";
import { debug } from "../lib/debug";
import { __global } from "../lib/global";
import {
  createModuleMap,
  initDomWebpackSsr,
  invalidateImportCacheOnFinish,
} from "../lib/ssr";
import { ENTRY_REACT_SERVER, invalidateModule } from "../plugin/utils";

export async function handler(request: Request): Promise<Response> {
  const reactServer = await importReactServer();

  // server action and render rsc
  const result = await reactServer.handler({ request });
  if (result instanceof Response) {
    return result;
  }

  // ssr rsc
  const ssrResult = await renderHtml(result.stream);
  return new Response(ssrResult.htmlStream, {
    status: ssrResult.status,
    headers: {
      "content-type": "text/html",
    },
  });
}

export async function importReactServer(): Promise<
  typeof import("./react-server")
> {
  if (import.meta.env.DEV) {
    return __global.dev.reactServer.ssrLoadModule(ENTRY_REACT_SERVER) as any;
  } else {
    return import("/dist/rsc/index.js" as string);
  }
}

export async function renderHtml(rscStream: ReadableStream) {
  await initDomWebpackSsr();

  const { default: reactServerDomClient } = await import(
    "react-server-dom-webpack/client.edge"
  );

  const [rscStream1, rscStream2] = rscStream.tee();

  // use unique id for each render to simplify ssr module invalidation during dev
  // (see src/lib/ssr.tsx for details)
  const renderId = Math.random().toString(36).slice(2);

  // TODO: Reac.use promise?
  const rscNode = await reactServerDomClient.createFromReadableStream(
    rscStream1,
    {
      ssrManifest: {
        moduleMap: createModuleMap({ renderId }),
        moduleLoading: null,
      },
    },
  );

  if (import.meta.env.DEV) {
    // ensure latest css
    invalidateModule(__global.dev.server, "\0virtual:ssr-assets");
    invalidateModule(__global.dev.server, "\0virtual:react-server-css.js");
    invalidateModule(__global.dev.server, "\0virtual:dev-ssr-css.css?direct");
  }
  const assets = (await import("virtual:ssr-assets" as string)).default;

  // two pass SSR to re-render on error
  let ssrStream: ReadableStream<Uint8Array>;
  let status = 200;
  try {
    ssrStream = await reactDomServer.renderToReadableStream(rscNode, {
      bootstrapModules: assets.bootstrapModules,
      onError(error, errorInfo) {
        // TODO: should handle SSR error which is not RSC error?
        debug.ssr("renderToReadableStream", { error, errorInfo });
      },
    });
  } catch (e) {
    // render empty as error fallback and
    // let browser render full CSR instead of hydration
    // which will reply client error boudnary from RSC error
    // TODO: proper two-pass SSR with error route tracking?
    // TODO: meta tag system
    const errorRoot = (
      <html data-no-hydate>
        <head>
          <meta charSet="utf-8" />
        </head>
        <body></body>
      </html>
    );
    ssrStream = await reactDomServer.renderToReadableStream(errorRoot, {
      bootstrapModules: assets.bootstrapModules,
    });
    status = getErrorStatus(e)?.status ?? 500;
  }

  const htmlStream = ssrStream
    .pipeThrough(invalidateImportCacheOnFinish(renderId))
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(injectToHead(assets.head))
    .pipeThrough(new TextEncoderStream())
    .pipeThrough(injectRSCPayload(rscStream2));

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
