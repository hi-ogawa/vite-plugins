import {
  createFromReadableStream,
  getAssetsManifest,
  initialize,
} from "@hiogawa/vite-rsc/ssr";
// @ts-ignore
import * as ReactDomServer from "react-dom/server.edge";
import { RSCStaticRouter, routeRSCServerRequest } from "react-router";

initialize();

export default async function handler(
  request: Request,
  callServer: (request: Request) => Promise<Response>,
) {
  const assets = getAssetsManifest().entry;
  const css = assets.deps.css.map((href) => (
    <link key={href} rel="stylesheet" href={href} precedence="high" />
  ));
  const js = assets.deps.js.map((href) => (
    <link key={href} rel="modulepreload" href={href} />
  ));

  return routeRSCServerRequest(
    request,
    callServer,
    (body) => createFromReadableStream(body),
    (payload) =>
      ReactDomServer.renderToReadableStream(
        <>
          <RSCStaticRouter payload={payload} />
          {css}
          {js}
        </>,
        {
          bootstrapModules: assets.bootstrapModules,
        },
      ),
  );
}
