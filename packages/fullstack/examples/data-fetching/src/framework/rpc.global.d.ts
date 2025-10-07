import type { RouterClient } from "@orpc/server";
import type { RouterUtils } from "@orpc/tanstack-query";
import { __rpc_router__ } from "../rpc";

declare global {
  var $rpc: RouterClient<typeof __rpc_router__>;
  var $rpcq: RouterUtils<RouterClient<typeof __rpc_router__>>;
}
