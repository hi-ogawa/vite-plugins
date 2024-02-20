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
    // expose env.kv
    Object.assign(globalThis, { env });

    // DevServerHook is implemented via custom rpc
    if (import.meta.env.DEV) {
      unstable_setDevServerHooks({
        getCriticalCss: env.__RPC.__remixGetCriticalCss,
      });
    }

    return remixHandler(request);
  };
}
