import React from "react";
import type { ReactFormState } from "react-dom/client";
import ReactDomServer from "react-dom/server.edge";
import { assetsManifest, createFromReadableStream, initialize } from "../ssr";
import type { RscPayload } from "./rsc";
import {
  createBufferedTransformStream,
  injectRscScript,
} from "./utils/rsc-script";

export async function renderHtml({
  stream,
  formState,
}: { stream: ReadableStream; formState?: ReactFormState }): Promise<Response> {
  initialize();

  const [stream1, stream2] = stream.tee();

  const assets = assetsManifest.entryAssets;

  // flight deserialization needs to be kicked in inside SSR context
  // for ReactDomServer preinit/preloading to work
  let payload: Promise<RscPayload>;
  function SsrRoot() {
    payload ??= createFromReadableStream<RscPayload>(stream1);
    const root = React.use(payload).root;
    const css = assets.css.map((href) => (
      <link key={href} rel="stylesheet" href={href} precedence="high" />
    ));
    return (
      <>
        {root}
        {css}
      </>
    );
  }

  const htmlStream = await ReactDomServer.renderToReadableStream(<SsrRoot />, {
    bootstrapModules: assetsManifest.entryAssets.js,
    // @ts-expect-error no types
    formState,
  });

  const responseStream = htmlStream
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(createBufferedTransformStream())
    .pipeThrough(injectRscScript(stream2))
    .pipeThrough(new TextEncoderStream());

  return new Response(responseStream, {
    headers: {
      "content-type": "text/html;charset=utf-8",
    },
  });
}
