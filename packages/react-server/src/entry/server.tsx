import { splitFirst } from "@hiogawa/utils";
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
    bootstrapModules.push(`/@id/__x00__virtual:client-bootstrap/dev`);
  } else {
    // inject asset url to SSR build via virtual module
    const mod = await import("virtual:client-bootstrap/build" as string);
    bootstrapModules.push(mod.default);
  }

  const ssrStream = await reactDomServer.renderToReadableStream(rscNode, {
    bootstrapModules,
  });

  let head = "";
  if (import.meta.env.DEV) {
    // TODO: remove link on first HMR on client
    const mod = __devServer.moduleGraph.getModuleById(
      "\0virtual:ssr-css/dev.css?direct",
    );
    if (mod) {
      __devServer.moduleGraph.invalidateModule(mod);
    }
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
