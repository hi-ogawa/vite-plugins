import type { RouterClient } from "@orpc/server";
import type { RouterUtils } from "@orpc/tanstack-query";
import { __rpc_router__ } from "../rpc";

// ORPC client is available as global.
// "Server-side client" is implemented as direct router invocation.
// https://orpc.unnoq.com/docs/best-practices/optimize-ssr
declare global {
  var $rpc: RouterClient<typeof __rpc_router__>;
  var $rpcq: RouterUtils<RouterClient<typeof __rpc_router__>>;
}
