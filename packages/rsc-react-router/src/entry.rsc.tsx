import {
  createTemporaryReferenceSet,
  decodeAction,
  decodeReply,
  loadServerAction,
  renderToReadableStream,
} from "@hiogawa/vite-rsc/rsc";
import { unstable_matchRSCServerRequest as matchRSCServerRequest } from "react-router";

import routes from "virtual:react-router-routes";

export async function callServer(request: Request): Promise<Response> {
  return await matchRSCServerRequest({
    createTemporaryReferenceSet,
    decodeReply,
    decodeAction,
    loadServerAction,
    request,
    routes,
    generateResponse(match, options) {
      return new Response(renderToReadableStream(match.payload, options), {
        status: match.statusCode,
        headers: match.headers,
      });
    },
  });
}
