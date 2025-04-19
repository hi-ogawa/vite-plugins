import { createServerConsumerManifest } from "@hiogawa/vite-rsc/core/client-ssr";
import * as React from "react";
import * as ReactDomServer from "react-dom/server.edge";
import { RSCStaticRouter, routeRSCServerRequest } from "react-router";
import * as ReactClient from "react-server-dom-webpack/client.edge";
import { importRsc } from "./extra/ssr";

export default async function handler(request: Request) {
  const { callServer } = await importRsc<typeof import("./entry.rsc")>();

  return routeRSCServerRequest(
    request,
    callServer,
    (body) =>
      ReactClient.createFromReadableStream(body, {
        serverConsumerManifest: createServerConsumerManifest,
      }),
    async (payload) => {
      return await ReactDomServer.renderToReadableStream(
        React.createElement(RSCStaticRouter, { payload }),
        {
          botstrapModules: [],
        },
      );
    },
  );
}
