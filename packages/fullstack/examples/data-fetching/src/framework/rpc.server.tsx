import { createRouterClient } from "@orpc/server";
import { __rpc_router__ } from "../rpc";

globalThis.$rpc = createRouterClient(__rpc_router__);
