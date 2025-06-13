import { getAssetsManifest } from "@hiogawa/vite-rsc/ssr";
import * as ReactClient from "@hiogawa/vite-rsc/ssr";
import React from "react";
// @ts-ignore
import * as ReactDOMServer from "react-dom/server.edge";
import type { RscPayload } from "./entry.rsc";

export async function handleSsr(rscStream: ReadableStream) {
  // deserialize RSC
  let payload: Promise<RscPayload>;
  function SsrRoot() {
    payload ??= ReactClient.createFromReadableStream<RscPayload>(rscStream);
    return React.use(payload).root;
  }

  // render html (traditional SSR)
  const htmlStream = ReactDOMServer.renderToReadableStream(<SsrRoot />, {
    bootstrapScriptContent: getAssetsManifest().bootstrapScriptContent,
  });

  return htmlStream;
}
