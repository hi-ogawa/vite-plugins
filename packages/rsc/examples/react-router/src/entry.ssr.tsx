import {
  createServerConsumerManifest,
  importAssets,
  initialize,
} from "@hiogawa/vite-rsc/ssr";
// @ts-ignore
import * as ReactDomServer from "react-dom/server.edge";
import { RSCStaticRouter, routeRSCServerRequest } from "react-router";
// @ts-ignore
import * as ReactClient from "react-server-dom-webpack/client.edge";

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
    (body) =>
      ReactClient.createFromReadableStream(body, {
        serverConsumerManifest: createServerConsumerManifest(),
      }),
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
