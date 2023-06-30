import type { RequestHandler } from "@hattip/compose";
import { TINY_RPC_ENDPOINT } from "./common";
import { createTinyRpcHandler } from "./internal/server";
import { rpcRoutes } from "./routes";

export function tinyRpcHandler(): RequestHandler {
  return createTinyRpcHandler({
    endpoint: TINY_RPC_ENDPOINT,
    routes: rpcRoutes,
  });
}
