// @ts-ignore
import * as ReactDomServer from "react-dom/server.edge";
import { RSCStaticRouter, routeRSCServerRequest } from "react-router";
// @ts-ignore
import * as ReactClient from "react-server-dom-webpack/client.edge";
import {
  createServerConsumerManifest,
  importAssets,
  importRsc,
  initialize,
} from "../../../dist/ssr";

initialize();

export default async function handler(request: Request) {
  const { callServer } = await importRsc<typeof import("./entry.rsc")>();
  const assets = await importAssets();

  return routeRSCServerRequest(
    request,
    callServer,
    (body) =>
      ReactClient.createFromReadableStream(body, {
        serverConsumerManifest: createServerConsumerManifest(),
      }),
    (payload) =>
      ReactDomServer.renderToReadableStream(
        <RSCStaticRouter payload={payload} />,
        {
          bootstrapModules: assets.bootstrapModules,
        },
      ),
  );
}
