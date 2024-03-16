import { type RequestHandler, compose } from "@hattip/compose";
import { globApiRoutes } from "@hiogawa/vite-glob-routes/dist/hattip";
import { rpcHandler } from "../rpc/server";
import { logError } from "./log";
import { requestContextStorageHandler } from "./request-context";
import { sessionHandler } from "./session";
import { ssrHandler } from "./ssr";

export function createHattipApp() {
  return compose(
    errorHanlder(),
    requestContextStorageHandler(),
    sessionHandler(),
    rpcHandler(),
    globApiRoutes(),
    ssrHandler()
  );
}

function errorHanlder(): RequestHandler {
  return async (ctx) => {
    ctx.handleError = (e) => {
      logError(e);
      return new Response("internal server error", { status: 500 });
    };
  };
}
