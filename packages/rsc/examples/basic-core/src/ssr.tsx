import * as ReactClient from "@hiogawa/vite-rsc/react/ssr";
import React from "react";
// @ts-ignore
import * as ReactDomServer from "react-dom/server.edge";
import { injectRSCPayload } from "rsc-html-stream/server";

export async function renderHtml({ stream }: { stream: ReadableStream }) {
  ReactClient.setRequireModule({
    load(id) {
      return import(/* @vite-ignore */ id);
    },
  });

  const [stream1, stream2] = stream.tee();

  let payload: Promise<React.ReactNode>;
  function SsrRoot() {
    payload ??= ReactClient.createFromReadableStream(stream1);
    return React.use(payload);
  }

  const htmlStream = await (
    ReactDomServer as typeof import("react-dom/server")
  ).renderToReadableStream(<SsrRoot />, {
    bootstrapModules: ["/src/browser.tsx"],
  });

  return htmlStream.pipeThrough(injectRSCPayload(stream2));
}
