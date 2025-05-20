import React from "react";
import type { ReactFormState } from "react-dom/client";
import ReactDomServer from "react-dom/server.edge";
import { injectRSCPayload } from "rsc-html-stream/server";
import {
  createFromReadableStream,
  getAssetsManifest,
  initialize,
} from "../ssr";
import { withBase } from "../utils/base";
import type { RscPayload } from "./rsc";

export async function renderHtml({
  stream,
  formState,
  options,
}: {
  stream: ReadableStream;
  formState?: ReactFormState;
  options?: { nonce?: string; __nojs?: boolean };
}): Promise<Response> {
  initialize();

  const [stream1, stream2] = stream.tee();

  const assets = getAssetsManifest().entry;

  // flight deserialization needs to be kicked off inside SSR context
  // for ReactDomServer preinit/preloading to work
  let payload: Promise<RscPayload>;
  function SsrRoot() {
    payload ??= createFromReadableStream<RscPayload>(stream1, {
      nonce: options?.nonce,
    });
    const root = React.use(payload).root;
    return root;
  }

  const htmlStream = await ReactDomServer.renderToReadableStream(<SsrRoot />, {
    bootstrapModules: options?.__nojs
      ? []
      : assets.bootstrapModules.map((href) => withBase(href)),
    nonce: options?.nonce,
    // @ts-expect-error no types
    formState,
  });

  let responseStream: ReadableStream = htmlStream;
  if (!options?.__nojs) {
    responseStream = responseStream.pipeThrough(
      injectRSCPayload(stream2, {
        nonce: options?.nonce,
      }),
    );
  }

  return new Response(responseStream, {
    headers: {
      "content-type": "text/html;charset=utf-8",
      vary: "accept",
    },
  });
}
