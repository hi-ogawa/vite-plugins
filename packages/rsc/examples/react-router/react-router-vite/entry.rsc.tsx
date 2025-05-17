import {
  decodeAction,
  decodeReply,
  importSsr,
  initialize,
  loadServerAction,
  renderToReadableStream,
} from "@hiogawa/vite-rsc/rsc";
import {
  type DecodeCallServerFunction,
  type DecodeFormActionFunction,
  matchRSCServerRequest,
} from "react-router/rsc";

// @ts-ignore
import routes from "../app/routes?react-router-routes";

initialize();

// workaround for better-sqlite
// https://github.com/TooTallNate/node-bindings/blob/c8033dcfc04c34397384e23f7399a30e6c13830d/bindings.js#L90-L94
import { createRequire } from "node:module";
(globalThis as any).__non_webpack_require__ = createRequire(import.meta.url);

const decodeCallServer: DecodeCallServerFunction = async (actionId, reply) => {
  const args = await decodeReply(reply);
  const action = await loadServerAction(actionId);
  return action.bind(null, ...args);
};

const decodeFormAction: DecodeFormActionFunction = async (formData) => {
  return await decodeAction(formData);
};

async function callServer(request: Request) {
  return await matchRSCServerRequest({
    decodeCallServer,
    decodeFormAction,
    request,
    routes,
    generateResponse(match) {
      return new Response(renderToReadableStream(match.payload), {
        status: match.statusCode,
        headers: match.headers,
      });
    },
  });
}

export default async function handler(requrest: Request) {
  const ssr = await importSsr<typeof import("./entry.ssr")>();
  return ssr.default(requrest, callServer);
}
