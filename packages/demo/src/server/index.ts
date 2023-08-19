import { type RequestHandler, compose } from "@hattip/compose";
import { createLoggerHandler } from "@hiogawa/utils-hattip";
import { globApiRoutes } from "@hiogawa/vite-glob-routes/dist/hattip";
import { rpcHandler } from "../rpc/server";
import { logError } from "./log";
import { requestContextStorageHandler } from "./request-context";
import { sessionHandler } from "./session";
import { ssrHandler } from "./ssr";

export function createHattipApp() {
  return compose(
    errorHanlder(),
    createLoggerHandler({
      printer(e) {
        const method = e.request.method;
        const url = new URL(e.request.url);
        let pathname = url.pathname;
        const loader = url.searchParams.get("loader-route-id");
        if (loader) {
          pathname = `${pathname}(${loader})`;
        }
        if (e.type === "request") {
          console.log(`  --> ${method} ${pathname}`);
        }
        if (e.type === "response") {
          console.log(
            `  <-- ${method} ${pathname} ${e.response.status} ${Math.floor(
              e.duration
            )}ms`
          );
        }
      },
    }),
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
