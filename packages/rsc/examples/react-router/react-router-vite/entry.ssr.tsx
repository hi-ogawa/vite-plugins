import {
  createFromReadableStream,
  getAssetsManifest,
} from "@hiogawa/vite-rsc/ssr";
// @ts-ignore
import * as ReactDomServer from "react-dom/server.edge";
import {
  unstable_RSCStaticRouter as RSCStaticRouter,
  unstable_routeRSCServerRequest as routeRSCServerRequest,
} from "react-router";

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
          bootstrapScriptContent: getAssetsManifest().bootstrapScriptContent,
        },
      );
    },
  });
}
