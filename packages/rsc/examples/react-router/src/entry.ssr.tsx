import {
  createFromReadableStream,
  importAssets,
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
  const assets = await importAssets();
  const css = assets.css.map((href) => (
    <link key={href} rel="stylesheet" href={href} precedence="high" />
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
        </>,
        {
          bootstrapModules: assets.js,
        },
      ),
  );
}
