import ReactDomServer from "react-dom/server.edge";
import ReactClient from "react-server-dom-webpack/client.edge";
import {
  createModuleMap,
  initializeReactClientSsr,
} from "./features/client-component/ssr";
import type { RscPayload } from "./server";
import { injectRscScript } from "./utils/rsc-script";

export async function renderHtml(stream: ReadableStream): Promise<Response> {
  initializeReactClientSsr();

  const [stream1, stream2] = stream.tee();

  const payload = await ReactClient.createFromReadableStream<RscPayload>(
    stream1,
    {
      serverConsumerManifest: {
        moduleMap: createModuleMap(),
      },
    },
  );

  // TODO: css
  // const ssrAssets = await import("virtual:ssr-assets");

  const htmlStream = await ReactDomServer.renderToReadableStream(payload.root, {
    // TODO:
    // bootstrapModules: ssrAssets.bootstrapModules,
    bootstrapModules: ["/@id/__x00__virtual:browser-entry"],
    // @ts-expect-error TODO: declare
    formState: payload.formState,
  });

  const responseStream = htmlStream
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(injectRscScript(stream2))
    .pipeThrough(new TextEncoderStream());

  return new Response(responseStream, {
    headers: {
      "content-type": "text/html;charset=utf-8",
    },
  });
}
