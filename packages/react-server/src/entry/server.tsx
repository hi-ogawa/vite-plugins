import { typedBoolean } from "@hiogawa/utils";
import reactDomServer from "react-dom/server.edge";
import { injectRSCPayload } from "rsc-html-stream/server";
import { unwrapRscRequest } from "../lib/shared";
import {
  createModuleMap,
  initDomWebpackSsr,
  invalidateImportCacheOnFinish,
} from "../lib/ssr";

export async function handler(request: Request): Promise<Response> {
  const entryRsc = await importEntryRsc();

  // action
  if (request.method === "POST") {
    await entryRsc.actionHandler({ request });
  }

  // check rsc-only request
  const rscRequest = unwrapRscRequest(request);

  // rsc
  const { rscStream, status } = entryRsc.render({
    request: rscRequest ?? request,
  });
  if (rscRequest) {
    return new Response(rscStream, {
      headers: {
        "content-type": "text/x-component",
      },
    });
  }

  // ssr rsc
  let htmlStream = await renderHtml(rscStream);
  return new Response(htmlStream, {
    status,
    headers: {
      "content-type": "text/html",
    },
  });
}

async function importEntryRsc(): Promise<typeof import("./react-server")> {
  if (import.meta.env.DEV) {
    return __rscDevServer.ssrLoadModule(
      "@hiogawa/react-server/entry-react-server"
    ) as any;
  } else {
    return import("/dist/rsc/index.js" as string);
  }
}

// TODO: full <html> render by RSC?
async function renderHtml(rscStream: ReadableStream): Promise<ReadableStream> {
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
    }
  );

  const ssrStream = await reactDomServer.renderToReadableStream(rscNode, {
    // TODO
    bootstrapModules: [],
    bootstrapScripts: [],
  });

  return ssrStream
    .pipeThrough(invalidateImportCacheOnFinish(renderId))
    .pipeThrough(await injectToHtmlTempalte())
    .pipeThrough(injectRSCPayload(rscStream2));
}

async function injectToHtmlTempalte() {
  let html = await importHtmlTemplate();

  if (import.meta.env.DEV) {
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
