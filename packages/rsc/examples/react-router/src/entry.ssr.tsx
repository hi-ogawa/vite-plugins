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
  return routeRSCServerRequest({
    request,
    callServer,
    decode: (body) => createFromReadableStream(body),
    renderHTML(getPayload) {
      return ReactDomServer.renderToReadableStream(
        <RSCStaticRouter getPayload={getPayload} />,
        {
          bootstrapModules: new URL(request.url).searchParams.has("__nojs")
            ? []
            : getAssetsManifest().entry.bootstrapModules,
        },
      );
    },
  });
}
