import reactDomServer from "react-dom/server.edge";
import { injectRSCPayload } from "rsc-html-stream/server";
import type { ViteDevServer } from "vite";
import type { RenderRsc } from "./entry-rsc";
import { moduleMap, unwrapRscRequest } from "./lib/shared";
import { initDomWebpackSsr, invalidateImportCacheOnFinish } from "./lib/ssr";

// injected globals during dev
declare let __devServer: ViteDevServer;
declare let __rscDevServer: ViteDevServer;

export async function handler(request: Request): Promise<Response> {
  // unique id for each render (see src/lib/ssr.tsx for the detail)
  const renderId = Math.random().toString(36).slice(2);

  // rsc request
  const rscRequest = unwrapRscRequest(request);
  if (rscRequest) {
    const { rscStream, status } = await renderRsc({
      request: rscRequest,
      renderId,
    });
    return new Response(rscStream, {
      status,
      headers: {
        "content-type": "text/x-component",
      },
    });
  }

  // ssr request
  // devRscId
  const { rscStream, status } = await renderRsc({ request, renderId });
  let htmlStream = await renderHtml(rscStream);
  htmlStream = htmlStream.pipeThrough(invalidateImportCacheOnFinish(renderId));
  return new Response(htmlStream, {
    status,
    headers: {
      "content-type": "text/html",
    },
  });
}

const renderRsc: RenderRsc = async (options) => {
  let mod: typeof import("./entry-rsc");
  if (import.meta.env.DEV) {
    mod = (await __rscDevServer.ssrLoadModule("/src/entry-rsc.tsx")) as any;
  } else {
    mod = await import("/dist/rsc/index.js" as string);
  }
  return mod.default(options);
};

async function renderHtml(rscStream: ReadableStream): Promise<ReadableStream> {
  initDomWebpackSsr();

  const { default: reactServerDomClient } = await import(
    "react-server-dom-webpack/client.edge"
  );

  const [rscStream1, rscStream2] = rscStream.tee();

  const rscNode = await reactServerDomClient.createFromReadableStream(
    rscStream1,
    {
      ssrManifest: {
        moduleMap: moduleMap,
        moduleLoading: null,
      },
    }
  );

  const htmlStream = await reactDomServer.renderToReadableStream(rscNode);

  return htmlStream
    .pipeThrough(await injectToHtmlTempalte())
    .pipeThrough(injectRSCPayload(rscStream2));
}

async function injectToHtmlTempalte() {
  let html: string;
  if (import.meta.env.DEV) {
    const mod = await import("/index.html?raw");
    html = await __devServer.transformIndexHtml("/", mod.default);
  } else {
    const mod = await import("/dist/client/index.html?raw");
    html = mod.default;
  }
  // ensure </body></html> trailer
  // https://github.com/devongovett/rsc-html-stream/blob/5c2f058996e42be6120dfaf1df384361331f3ea9/server.js#L2
  html = html.replace(/<\/body>\s*<\/html>\s*/, "</body></html>");

  // transformer to inject SSR stream
  const [pre, post] = html.split("<!--@INJECT_SSR@-->");
  const encoder = new TextEncoder();
  return new TransformStream<Uint8Array, Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(pre));
    },
    transform(chunk, controller) {
      controller.enqueue(chunk);
    },
    flush(controller) {
      controller.enqueue(encoder.encode(post));
    },
  });
}
