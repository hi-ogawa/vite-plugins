import { compose } from "@hattip/compose";
import { loggerMiddleware } from "@hiogawa/utils-experimental";
import { globApiRoutes } from "@hiogawa/vite-glob-routes/dist/hattip";
import { rpcHandler } from "../rpc/server";
import { requestContextStorageHandler } from "./request-context";
import { sessionHandler } from "./session";
import { ssrHandler } from "./ssr";

export function createHattipApp() {
  return compose(
    loggerMiddleware(),
    requestContextStorageHandler(),
    sessionHandler(),
    rpcHandler(),
    globApiRoutes(),
    ssrHandler()
  );
}
