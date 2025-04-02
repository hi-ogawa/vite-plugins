import { memoize, tinyassert } from "@hiogawa/utils";
import ReactDomServer from "react-dom/server.edge";
import ReactClient from "react-server-dom-webpack/client.edge";
import type { RscPayload } from "./server";
import type { ImportManifestEntry, ModuleMap } from "./types";
import {
  createBufferedTransformStream,
  injectRscScript,
} from "./utils/rsc-script";

export async function renderHtml(stream: ReadableStream): Promise<Response> {
  initializeReactClientSsr();

  const [stream1, stream2] = stream.tee();

  const payload = await ReactClient.createFromReadableStream<RscPayload>(
    stream1,
    {
      serverConsumerManifest: {
        moduleMap: createModuleMap(),
        moduleLoading: { prefix: "" },
      },
    },
  );

  const ssrAssets = await import("virtual:ssr-assets");

  const htmlStream = await ReactDomServer.renderToReadableStream(payload.root, {
    bootstrapModules: ssrAssets.bootstrapModules,
    // @ts-expect-error TODO: declare
    formState: payload.formState,
  });

  const responseStream = htmlStream
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(createBufferedTransformStream())
    .pipeThrough(injectRscScript(stream2))
    .pipeThrough(new TextEncoderStream());

  return new Response(responseStream, {
    headers: {
      "content-type": "text/html;charset=utf-8",
    },
  });
}

//
// client reference manifest
//

async function importClientReference(id: string) {
  if (import.meta.env.DEV) {
    return import(/* @vite-ignore */ id);
  } else {
    const clientReferences = await import(
      "virtual:client-references" as string
    );
    const dynImport = clientReferences.default[id];
    tinyassert(dynImport, `client reference not found '${id}'`);
    return dynImport();
  }
}

let init = false;
function initializeReactClientSsr(): void {
  if (init) return;
  init = true;

  Object.assign(globalThis, {
    __webpack_require__: memoize(importClientReference),
    __webpack_chunk_load__: async () => {},
  });
}

function createModuleMap(): ModuleMap {
  return new Proxy(
    {},
    {
      get(_target, id, _receiver) {
        return new Proxy(
          {},
          {
            get(_target, name, _receiver) {
              tinyassert(typeof id === "string");
              tinyassert(typeof name === "string");
              return {
                id,
                name,
                chunks: [],
              } satisfies ImportManifestEntry;
            },
          },
        );
      },
    },
  );
}
