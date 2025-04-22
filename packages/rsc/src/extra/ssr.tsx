import * as clientReferences from "virtual:vite-rsc/client-references";
import { tinyassert } from "@hiogawa/utils";
import React from "react";
import ReactDOM from "react-dom";
import type { ReactFormState } from "react-dom/client";
import ReactDomServer from "react-dom/server.edge";
import { setRequireModule } from "../core/ssr";
import { createFromReadableStream, importAssets } from "../ssr";
import type { RscPayload } from "./rsc";
import {
  createBufferedTransformStream,
  injectRscScript,
} from "./utils/rsc-script";

export async function renderHtml({
  stream,
  formState,
}: { stream: ReadableStream; formState?: ReactFormState }): Promise<Response> {
  setRequireModule({
    load: async (id) => {
      if (import.meta.env.DEV) {
        return import(/* @vite-ignore */ id);
      } else {
        const import_ = clientReferences.default[id];
        tinyassert(import_, `client reference not found '${id}'`);
        return import_();
      }
    },
    prepareDestination(id) {
      // we manually run `preloadModule` instead of react-server-dom-webpack's prepareDestinationWithChunks
      // maybe we can have this logic baked in react-server-dom-vite
      if (import.meta.env.DEV) {
        ReactDOM.preloadModule(id);
      } else {
        if (clientReferences.assetDeps) {
          const deps = clientReferences.assetDeps[id];
          if (deps) {
            for (const js of deps.js) {
              ReactDOM.preloadModule(js);
            }
          }
        }
      }
    },
  });

  const [stream1, stream2] = stream.tee();

  const assets = await importAssets();

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
    bootstrapModules: assets.js,
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
