import * as ReactClient from "@hiogawa/vite-rsc/react/ssr";
import React from "react";
import type { ReactFormState } from "react-dom/client";
// @ts-ignore
import * as ReactDomServer from "react-dom/server.edge";
import { injectRSCPayload } from "rsc-html-stream/server";
import type { RscPayload } from "./rsc";

export async function renderHtml({
  url,
  stream,
  formState,
}: {
  url: URL;
  stream: ReadableStream;
  formState?: ReactFormState;
}) {
  ReactClient.setRequireModule({
    load(id) {
      return import(/* @vite-ignore */ id);
    },
  });

  const [stream1, stream2] = stream.tee();

  let payload: Promise<RscPayload>;
  function SsrRoot() {
    payload ??= ReactClient.createFromReadableStream<RscPayload>(stream1);
    return React.use(payload).root;
  }

  const htmlStream = await (
    ReactDomServer as typeof import("react-dom/server")
  ).renderToReadableStream(<SsrRoot />, {
    bootstrapModules: url.search.includes("__nojs") ? [] : ["/src/browser.tsx"],
    // @ts-ignore
    formState,
  });

  return htmlStream.pipeThrough(injectRSCPayload(stream2));
}
