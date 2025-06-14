import bootstrapScriptContent from "virtual:vite-rsc/bootstrap-script-content";
import { injectRscStreamToHtml } from "@hiogawa/vite-rsc/rsc-html-stream/ssr"; // helper API
import * as ReactClient from "@hiogawa/vite-rsc/ssr"; // RSC API
import React from "react";
import type { ReactFormState } from "react-dom/client";
import * as ReactDOMServer from "react-dom/server.edge";
import type { RscPayload } from "./entry.rsc";

export async function renderHTML({
  stream,
  formState,
  options,
}: {
  stream: ReadableStream;
  formState?: ReactFormState;
  options?: { nonce?: string; debugNojs?: boolean };
}) {
  // copy RSC stream into two.
  // - one for SSR (ReactClient.createFromReadableStream below)
  // - another for browser hydration payload by injecting <script>...FLIGHT_DATA...</script>
  const [stream1, stream2] = stream.tee();

  // deserialize stream into react tree
  let payload: Promise<RscPayload>;
  function SsrRoot() {
    // flight deserialization needs to be kicked off inside ReactDOMServer context
    // for ReactDomServer preinit/preloading to work
    payload ??= ReactClient.createFromReadableStream<RscPayload>(stream1);
    return React.use(payload).root;
  }

  // render html (traditional SSR)
  const htmlStream = await ReactDOMServer.renderToReadableStream(<SsrRoot />, {
    bootstrapScriptContent: options?.debugNojs
      ? undefined
      : bootstrapScriptContent,
    nonce: options?.nonce,
    // @ts-expect-error no types
    formState,
  });

  let responseStream: ReadableStream = htmlStream;
  if (!options?.debugNojs) {
    // initial RSC stream is injected in SSR stream as <script>...FLIGHT_DATA...</script>
    responseStream = responseStream.pipeThrough(
      injectRscStreamToHtml(stream2, {
        nonce: options?.nonce,
      }),
    );
  }

  return responseStream;
}
