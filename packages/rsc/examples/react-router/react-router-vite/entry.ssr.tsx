import bootstrapScriptContent from "virtual:vite-rsc/bootstrap-script-content";
import { createFromReadableStream } from "@hiogawa/vite-rsc/ssr";
import * as ReactDomServer from "react-dom/server.edge";
import {
  unstable_RSCStaticRouter as RSCStaticRouter,
  unstable_routeRSCServerRequest as routeRSCServerRequest,
} from "react-router";

export default async function handler(request: Request) {
  const { callServer } = await import.meta.viteRsc.loadModule<
    typeof import("./entry.rsc")
  >("rsc", "index");
  return routeRSCServerRequest({
    request,
    callServer,
    decode: (body) => createFromReadableStream(body),
    renderHTML(getPayload) {
      return ReactDomServer.renderToReadableStream(
        <RSCStaticRouter getPayload={getPayload} />,
        {
          bootstrapScriptContent,
        },
      );
    },
  });
}
