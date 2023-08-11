import { type RequestHandler, compose } from "@hattip/compose";
import { globApiRoutes } from "@hiogawa/vite-glob-routes/dist/hattip";
import { logError } from "./log";
import { ssrHandler } from "./ssr";

export function createHattipApp() {
  return compose(errorHanlder(), globApiRoutes(), ssrHandler());
}

function errorHanlder(): RequestHandler {
  return async (ctx) => {
    ctx.handleError = (e) => {
      logError(e);
      return new Response("internal server error", { status: 500 });
    };
  };
}
