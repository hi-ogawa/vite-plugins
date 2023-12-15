import * as build from "virtual:remix/server-build";
import {
  createRequestHandler,
  unstable_setDevServerHooks,
} from "@remix-run/server-runtime";

export default {
  fetch: createFetchHandler(),
};

function createFetchHandler() {
  const mode = import.meta.env.DEV ? "development" : "production";
  const remixHandler = createRequestHandler(build, mode);

  return async (request: Request, env: any) => {
    // DevServerHook is implemented via custom rpc
    if (env.__VITE_NODE_MINIFLARE_CLIENT) {
      unstable_setDevServerHooks({
        getCriticalCss:
          env.__VITE_NODE_MINIFLARE_CLIENT.rpc.__remixGetCriticalCss,
      });
    }
    return remixHandler(request);
  };
}
