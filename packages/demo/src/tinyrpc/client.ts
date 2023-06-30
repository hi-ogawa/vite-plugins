import { TINY_RPC_ENDPOINT } from "./common";
import { createTinyRpcFetchProxy } from "./internal/client";
import { createReactQueryOptionsProxy } from "./internal/react-query";
import type { rpcRoutes } from "./routes";

export const rpcClient = createTinyRpcFetchProxy<typeof rpcRoutes>({
  endpoint: TINY_RPC_ENDPOINT,
});

export const rpcClientQuery = createReactQueryOptionsProxy(rpcClient);
