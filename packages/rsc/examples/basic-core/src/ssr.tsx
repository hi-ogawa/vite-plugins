import * as ReactClient from "@hiogawa/vite-rsc/react/ssr";
import type React from "react";
// @ts-ignore
import * as ReactDomServer from "react-dom/server.edge";
import { injectRSCPayload } from "rsc-html-stream/server";

export async function renderHtml({ stream }: { stream: ReadableStream }) {
  ReactClient.setRequireModule({
    load(id) {
      // console.log("[ReactClient.load]", id);
      return import(/* @vite-ignore */ id);
    },
  });

  const [stream1, stream2] = stream.tee();

  const root: React.ReactNode =
    await ReactClient.createFromReadableStream(stream1);

  const htmlStream = await (
    ReactDomServer as typeof import("react-dom/server")
  ).renderToReadableStream(root, {
    bootstrapModules: ["/src/browser.tsx"],
  });

  return htmlStream.pipeThrough(injectRSCPayload(stream2));
}
