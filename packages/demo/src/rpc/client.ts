import { createFnRecordQueryProxy } from "@hiogawa/query-proxy";
import { createTinyRpcClientProxy } from "@hiogawa/tiny-rpc";
import type { rpcRoutes } from "./server";

export const RPC_ENDPOINT = "/trpc";

export const rpcClient = createTinyRpcClientProxy<typeof rpcRoutes>({
  endpoint: RPC_ENDPOINT,
});

export const rpcClientQuery = createFnRecordQueryProxy(rpcClient);
