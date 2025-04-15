import type { ReactFormState } from "react-dom/client";
import ReactDomServer from "react-dom/server.edge";
import ReactClient from "react-server-dom-webpack/client.edge";
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

export async function renderHtml({
  stream,
  formState,
}: { stream: ReadableStream; formState?: ReactFormState }): Promise<Response> {
  initializeReactClientSsr();

  const [stream1, stream2] = stream.tee();

  const payload = await ReactClient.createFromReadableStream<RscPayload>(
    stream1,
    {
      serverConsumerManifest: {
        moduleMap: createSsrModuleMap(),
        moduleLoading: { prefix: "" },
      },
    },
  );

  const ssrAssets = await import("virtual:vite-rsc/ssr-assets");

  const htmlStream = await ReactDomServer.renderToReadableStream(payload.root, {
    bootstrapModules: ssrAssets.bootstrapModules,
    // @ts-expect-error no types
    formState,
  });

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
