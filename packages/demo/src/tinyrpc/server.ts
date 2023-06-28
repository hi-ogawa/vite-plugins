import type { RequestHandler } from "@hattip/compose";
import { TINY_RPC_ENDPOINT } from "./common";
import type { TinyRpcProxy } from "./internal/common";
import {
  type ReactQueryOptionsProxy,
  createReactQueryOptionsProxy,
} from "./internal/react-query";
import { createTinyRpcCaller, createTinyRpcHandler } from "./internal/server";
import { tinyRpcRoutes } from "./routes";

export function rpcHandler(): RequestHandler {
  const handler = createTinyRpcHandler({
    endpoint: TINY_RPC_ENDPOINT,
    routes: tinyRpcRoutes,
  });
  return async (ctx) => {
    const rpcCaller = createTinyRpcCaller<typeof tinyRpcRoutes>({
      ctx,
      routes: tinyRpcRoutes,
    });
    ctx.rpcCaller = rpcCaller;
    ctx.rpcQuery = createReactQueryOptionsProxy(rpcCaller);
    return handler(ctx);
  };
}

export type RpcProxy = TinyRpcProxy<typeof tinyRpcRoutes>;
export type RpcQuery = ReactQueryOptionsProxy<RpcProxy>;
