import { getAssetsManifest } from "@hiogawa/vite-rsc/ssr";
import * as ReactClient from "@hiogawa/vite-rsc/ssr";
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
  // deserialize stream into react tree
  let payload: Promise<RscPayload>;
  function SsrRoot() {
    // flight deserialization needs to be kicked off inside ReactDOMServer context
    // for ReactDomServer preinit/preloading to work
    payload ??= ReactClient.createFromReadableStream<RscPayload>(stream);
    return React.use(payload).root;
  }

  // render html (traditional SSR)
  const htmlStream = await ReactDOMServer.renderToReadableStream(<SsrRoot />, {
    bootstrapScriptContent: options?.debugNojs
      ? undefined
      : getAssetsManifest().bootstrapScriptContent,
    nonce: options?.nonce,
    // @ts-expect-error no types
    formState,
  });

  return htmlStream;
}
