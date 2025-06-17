import bootstrapScriptContent from "virtual:vite-rsc/bootstrap-script-content";
import { injectRscStreamToHtml } from "@hiogawa/vite-rsc/rsc-html-stream/ssr"; // helper API
import * as ReactClient from "@hiogawa/vite-rsc/ssr"; // RSC API
import React from "react";
import type { ReactFormState } from "react-dom/client";
import * as ReactDOMServer from "react-dom/server.edge";
import type { RscPayload } from "./entry.rsc";

export type RenderHTML = typeof renderHTML;

export async function renderHTML(
  rscStream: ReadableStream,
  {
    formState,
    options,
  }: {
    formState?: ReactFormState;
    options?: { nonce?: string; debugNojs?: boolean };
  },
) {
  // duplicate one RSC stream into two.
  // - one for SSR (ReactClient.createFromReadableStream below)
  // - another for browser hydration payload by injecting <script>...FLIGHT_DATA...</script>.
  const [rscStream1, rscStream2] = rscStream.tee();

  // deserialize RSC stream back to React VDOM
  let payload: Promise<RscPayload>;
  function SsrRoot() {
    // deserialization needs to be kicked off inside ReactDOMServer context
    // for ReactDomServer preinit/preloading to work
    payload ??= ReactClient.createFromReadableStream<RscPayload>(rscStream1);
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
    // initial RSC stream is injected in HTML stream as <script>...FLIGHT_DATA...</script>
    responseStream = responseStream.pipeThrough(
      injectRscStreamToHtml(rscStream2, {
        nonce: options?.nonce,
      }),
    );
  }

  return responseStream;
}

export async function renderHTMLDevProxy(request: Request) {
  const meta = JSON.parse(request.headers.get("x-vite-rsc-render-html")!);
  const htmlStream = await renderHTML(request.body!, meta);
  return new Response(htmlStream);
}
