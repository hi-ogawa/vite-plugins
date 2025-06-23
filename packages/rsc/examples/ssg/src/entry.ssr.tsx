import { injectRscStreamToHtml } from "@hiogawa/vite-rsc/rsc-html-stream/ssr";
import * as ReactClient from "@hiogawa/vite-rsc/ssr";
import React from "react";
import * as ReactDomServer from "react-dom/server.edge";
import type { RscPayload } from "./entry.shared";

export async function renderHtml(rscStream: ReadableStream<Uint8Array>) {
  const [rscStream1, rscStream2] = rscStream.tee();

  let payload: Promise<RscPayload>;
  function SsrRoot() {
    payload ??= ReactClient.createFromReadableStream<RscPayload>(rscStream1);
    const root = React.use(payload).root;
    return root;
  }

  const bootstrapScriptContent =
    await import.meta.viteRsc.loadBootstrapScriptContent("index");

  const htmlStream = await ReactDomServer.renderToReadableStream(<SsrRoot />, {
    bootstrapScriptContent,
  });
  // for SSG
  await htmlStream.allReady;

  let responseStream: ReadableStream<Uint8Array> = htmlStream;
  responseStream = responseStream.pipeThrough(
    injectRscStreamToHtml(rscStream2),
  );
  return responseStream;
}
