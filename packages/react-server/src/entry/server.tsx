import { splitFirst, typedBoolean } from "@hiogawa/utils";
import reactDomServer from "react-dom/server.edge";
import { injectRSCPayload } from "rsc-html-stream/server";
import {
  createModuleMap,
  initDomWebpackSsr,
  invalidateImportCacheOnFinish,
} from "../lib/ssr";

export async function handler(request: Request): Promise<Response> {
  const reactServer = await importReactServer();

  // server action and render rsc
  const result = await reactServer.handler({ request });
  if (result instanceof Response) {
    return result;
  }

  // ssr rsc
  const htmlStream = await renderHtml(result.stream);
  return new Response(htmlStream, {
    status: result.status,
    headers: {
      "content-type": "text/html",
    },
  });
}

export async function importReactServer(): Promise<
  typeof import("./react-server")
> {
  if (import.meta.env.DEV) {
    return __rscDevServer.ssrLoadModule(__rscEntry) as any;
  } else {
    return import("/dist/rsc/index.js" as string);
  }
}

// TODO: full <html> render by RSC?
export async function renderHtml(
  rscStream: ReadableStream,
): Promise<ReadableStream> {
  await initDomWebpackSsr();

  const { default: reactServerDomClient } = await import(
    "react-server-dom-webpack/client.edge"
  );

  const [rscStream1, rscStream2] = rscStream.tee();

  // use unique id for each render to simplify ssr module invalidation during dev
  // (see src/lib/ssr.tsx for details)
  const renderId = Math.random().toString(36).slice(2);

  const rscNode = await reactServerDomClient.createFromReadableStream(
    rscStream1,
    {
      ssrManifest: {
        moduleMap: createModuleMap({ renderId }),
        moduleLoading: null,
      },
    },
  );

  let bootstrapModules: string[] = [];
  if (import.meta.env.DEV) {
    bootstrapModules.push(`/@id/__x00__virtual:browser-bootstrap/dev`);
  } else {
    // inject asset url to SSR build via virtual module
    const mod = await import("virtual:browser-bootstrap/build" as string);
    bootstrapModules.push(mod.default);
  }

  const ssrStream = await reactDomServer.renderToReadableStream(rscNode, {
    bootstrapModules,
  });

  let head = "";
  if (import.meta.env.DEV) {
    // TODO: invalidate virtual module in each render?
    head = `<link rel="stylesheet" href="/@id/__x00__virtual:ssr-css/dev.css?direct" />`;
  } else {
    const mod = await import("virtual:ssr-css/build" as string);
    head = mod.default;
  }

  return ssrStream
    .pipeThrough(invalidateImportCacheOnFinish(renderId))
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(injectToHead(head))
    .pipeThrough(new TextEncoderStream())
    .pipeThrough(injectRSCPayload(rscStream2));

  // return ssrStream
  //   .pipeThrough(invalidateImportCacheOnFinish(renderId))
  //   .pipeThrough(await injectToHtmlTempalte())
  //   .pipeThrough(injectRSCPayload(rscStream2));
}

function injectToHead(data: string) {
  const marker = "</head>";
  let done = false;
  return new TransformStream<string, string>({
    transform(chunk, controller) {
      if (!done && chunk.includes(marker)) {
        const [pre, post] = splitFirst(chunk, marker);
        controller.enqueue(pre + data + marker + post);
        done = true;
        return;
      }
      controller.enqueue(chunk);
    },
  });
}

// @ts-ignore
async function injectToHtmlTempalte() {
  let html = await importHtmlTemplate();

  if (import.meta.env.DEV) {
    // TODO: let use manage

    // fix dev FOUC (cf. https://github.com/hi-ogawa/vite-plugins/pull/110)
    // for now crawl only direct dependency of entry-client
    const entry = "/src/entry-client";
    await __devServer.transformRequest(entry);
    const modNode = await __devServer.moduleGraph.getModuleByUrl(entry);
    if (modNode) {
      const links = [...modNode.importedModules]
        .map((modNode) => modNode.id)
        .filter(typedBoolean)
        .filter((id) => id.match(CSS_LANGS_RE))
        .map((id) => `<link rel="stylesheet" href="${id}?direct" />\n`)
        .join("");
      html = html.replace("</head>", `${links}</head>`);
    }
  }

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

async function importHtmlTemplate() {
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

// cf. https://github.com/vitejs/vite/blob/d6bde8b03d433778aaed62afc2be0630c8131908/packages/vite/src/node/constants.ts#L49C23-L50
const CSS_LANGS_RE =
  /\.(css|less|sass|scss|styl|stylus|pcss|postcss|sss)(?:$|\?)/;
