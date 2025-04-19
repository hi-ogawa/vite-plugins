import { createServerConsumerManifest } from "@hiogawa/vite-rsc/core/client-ssr";
import * as React from "react";
// @ts-ignore
import * as ReactDomServer from "react-dom/server.edge";
import { RSCStaticRouter, routeRSCServerRequest } from "react-router";
// @ts-ignore
import * as ReactClient from "react-server-dom-webpack/client.edge";
import { importRsc, initialize } from "./extra/ssr";

initialize();

export default async function handler(request: Request) {
  const { callServer } = await importRsc<typeof import("./entry.rsc")>();

  return routeRSCServerRequest(
    request,
    callServer,
    (body) =>
      ReactClient.createFromReadableStream(body, {
        serverConsumerManifest: createServerConsumerManifest,
      }),
    (payload) =>
      ReactDomServer.renderToReadableStream(
        React.createElement(RSCStaticRouter, { payload }),
        {
          botstrapModules: [],
        },
      ),
  );
}
