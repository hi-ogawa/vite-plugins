import { PassThrough, Readable } from "node:stream";
import React from "react";
import ReactDOM from "react-dom";
import ReactDomServer from "react-dom/server";
import ReactClient from "react-server-dom-webpack/client.node";
import {
  createSsrModuleMap,
  initializeReactClientSsr,
} from "./core/client-ssr";
import { getBrowserPreamble } from "./core/shared";
import type { RscPayload } from "./server";
import {
  createBufferedTransformStream,
  injectRscScript,
} from "./utils/rsc-script";

export async function renderHtml(stream: ReadableStream): Promise<Response> {
  initializeReactClientSsr();

  const [stream1, stream2] = stream.tee();

  // flight deserialization needs to be kicked in inside SSR context
  // for ReactDomServer preinit/preloading to work
  const getPayload = () => {
    return ReactClient.createFromNodeStream<RscPayload>(
      Readable.fromWeb(stream1 as any),
      {
        moduleMap: createSsrModuleMap(),
        moduleLoading: { prefix: "" },
      },
    );
  };

  let payload: Promise<RscPayload>;
  function SsrRoot() {
    ReactDOM.preloadModule("/src/counter.tsx");
    payload ??= getPayload();
    return React.use(payload).root;
  }

  const ssrAssets = await import("virtual:vite-rsc/ssr-assets");

  const htmlNodeStream = ReactDomServer.renderToPipeableStream(<SsrRoot />, {
    bootstrapModules: ssrAssets.bootstrapModules,
    // TODO: how to pass formState here if we createFromNodeStream inside SsrRoot?
    // formState
  });

  const htmlStream = Readable.toWeb(
    htmlNodeStream.pipe(new PassThrough()),
  ) as ReadableStream<Uint8Array>;

  const responseStream = htmlStream
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(createBufferedTransformStream())
    .pipeThrough(injectRscScript(stream2, getBrowserPreamble()))
    .pipeThrough(new TextEncoderStream());

  return new Response(responseStream, {
    headers: {
      "content-type": "text/html;charset=utf-8",
    },
  });
}
