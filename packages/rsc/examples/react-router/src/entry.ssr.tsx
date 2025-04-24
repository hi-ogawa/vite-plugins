import {
  createFromReadableStream,
  importAssets,
  initialize,
} from "@hiogawa/vite-rsc/ssr";
import React from "react";
// @ts-ignore
import * as ReactDomServer from "react-dom/server.edge";
import { RSCStaticRouter, routeRSCServerRequest } from "react-router";
import type { ServerPayload } from "react-router/rsc";

initialize();

export default async function handler(
  request: Request,
  callServer: (request: Request) => Promise<Response>,
) {
  const assets = await importAssets();
  const css = assets.css.map((href) => (
    <link key={href} rel="stylesheet" href={href} precedence="high" />
  ));

  // rsc decoding (flight client) needs to be triggered inside fizz context (ssr)
  // so that `ReactDOM.preinit/preloadModule` (aka prepare destination) can hoist client reference links.
  let payload: Promise<ServerPayload>;
  function SsrRoot(props: { getPayload: () => Promise<ServerPayload> }) {
    payload ??= props.getPayload();
    return (
      <>
        <RSCStaticRouter payload={React.use(payload) as any} />
        {css}
      </>
    );
  }

  return routeRSCServerRequest(
    request,
    callServer,
    // hack to delay `decode`` inside `renderHTML`
    // https://github.com/remix-run/react-router/blob/692ce42b6c7d1e2d7ddc43213585154fc1dfeabc/packages/react-router/lib/rsc/server.ssr.tsx#L54-L65
    // @ts-ignore
    (body) => () => createFromReadableStream(body),
    (payload) =>
      ReactDomServer.renderToReadableStream(
        // @ts-ignore
        <SsrRoot getPayload={payload} />,
        {
          bootstrapModules: assets.js,
          // TODO: `payload.type === "redirect"` case needs to be handled through `onError`?
          // onError: () => {}
        },
      ),
  );
}
