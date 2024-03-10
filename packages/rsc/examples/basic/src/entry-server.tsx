import reactDomServer from "react-dom/server.edge";
import { injectRSCPayload } from "rsc-html-stream/server";
import type { ViteDevServer } from "vite";
import { devModuleMap } from "./config-dom";
import { initDomWebpackSsr } from "./config-dom-ssr";

// injected globals during dev
declare let __devServer: ViteDevServer;
declare let __rscDevServer: ViteDevServer;

export async function handler(_request: Request): Promise<Response> {
  const { rscStream } = await renderRsc();
  const htmlStream = await renderHtml(rscStream);
  return new Response(htmlStream, {
    headers: {
      "content-type": "text/html",
    },
  });
}

async function renderRsc() {
  let mod: any;
  if (import.meta.env.DEV) {
    mod = await __rscDevServer.ssrLoadModule("/src/entry-rsc.tsx");
  } else {
    mod = await import("/dist/rsc/index.js" as string);
  }
  return (mod as typeof import("./entry-rsc")).default();
}

async function renderHtml(rscStream: ReadableStream): Promise<ReadableStream> {
  initDomWebpackSsr();

  const { default: reactServerDomClient } = await import(
    "react-server-dom-webpack/client.edge"
  );

  const [rscStream1, rscStream2] = rscStream.tee();

  console.log("-> reactServerDomClient.createFromReadableStream");
  const rscNode = await reactServerDomClient.createFromReadableStream(
    rscStream1,
    {
      ssrManifest: {
        moduleMap: devModuleMap,
        moduleLoading: null,
      },
    }
  );
  console.log("-> reactServerDomClient.createFromReadableStream");

  console.log("-> reactDomServer.renderToReadableStream");
  const htmlStream = await reactDomServer.renderToReadableStream(rscNode);
  console.log("<- reactDomServer.renderToReadableStream");

  const htmlTemplate = await getHtmlTemplate();
  const [pre, post] = htmlTemplate.split("<!--@INJECT_SSR@-->");
  const htmlStream2 = concatStreams<Uint8Array>([
    new TextEncoder().encode(pre),
    htmlStream,
    new TextEncoder().encode(post),
  ]);

  const htmlStream3 = htmlStream2.pipeThrough(injectRSCPayload(rscStream2));
  return htmlStream3;
}

async function getHtmlTemplate() {
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
  return html;
}

function concatStreams<T>(
  streams: (T | ReadableStream<T>)[]
): ReadableStream<T> {
  let cancelled = false;
  return new ReadableStream({
    async start(controller) {
      for (const stream of streams) {
        if (cancelled) return;
        if (stream instanceof ReadableStream) {
          for await (const chunk of stream as any as AsyncIterable<T>) {
            if (cancelled) return;
            controller.enqueue(chunk);
          }
        } else {
          controller.enqueue(stream);
        }
      }
      controller.close();
    },
    cancel() {
      cancelled = true;
    },
  });
}
