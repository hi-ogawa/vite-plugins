import { createRouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { __rpc_router__ } from "../rpc";

globalThis.$rpc = createRouterClient(__rpc_router__);
globalThis.$rpcq = createTanstackQueryUtils($rpc);
