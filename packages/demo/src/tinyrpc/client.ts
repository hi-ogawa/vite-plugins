import { TINY_RPC_ENDPOINT } from "./common";
import { createTinyRpcFetchProxy } from "./internal/client";
import { createReactQueryOptionsProxy } from "./internal/react-query";
import type { tinyRpcRoutes } from "./routes";

export const rpcClient = createTinyRpcFetchProxy<typeof tinyRpcRoutes>({
  endpoint: TINY_RPC_ENDPOINT,
});

export const rpcQuery = createReactQueryOptionsProxy(rpcClient);
