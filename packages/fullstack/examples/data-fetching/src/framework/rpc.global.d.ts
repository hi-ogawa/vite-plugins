import type { RouterClient } from "@orpc/server";
import { __rpc_router__ } from "../rpc";

declare global {
  var $rpc: RouterClient<typeof __rpc_router__>;
}
