import { splitFirst, tinyassert } from "@hiogawa/utils";
import reactDomServer from "react-dom/server.edge";
import { injectRSCPayload } from "rsc-html-stream/server";
import type { ViteDevServer } from "vite";
import {
  createModuleMap,
  initDomWebpackSsr,
  invalidateImportCacheOnFinish,
} from "../lib/ssr";
import { invalidateModule } from "../plugin/utils";

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
    bootstrapModules.push("/src/entry-client");
  } else {
    // inject asset url to SSR build via virtual module
    const mod = await import("virtual:client-bootstrap/build" as string);
    bootstrapModules.push(mod.default);
  }

  const ssrStream = await reactDomServer.renderToReadableStream(rscNode, {
    bootstrapModules,
  });

  let head: string;
  if (import.meta.env.DEV) {
    invalidateModule(__devServer, "\0virtual:ssr-head/dev");
    const mod: any = await __devServer.ssrLoadModule("virtual:ssr-head/dev");
    head = mod.default;
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
