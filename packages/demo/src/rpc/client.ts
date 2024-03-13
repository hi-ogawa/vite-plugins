import { createFnRecordQueryProxy } from "@hiogawa/query-proxy";
import { httpClientAdapter, proxyTinyRpc } from "@hiogawa/tiny-rpc";
import type { rpcRoutes } from "./server";

export const RPC_ENDPOINT = "/trpc";

export const rpcClient = proxyTinyRpc<typeof rpcRoutes>({
  adapter: httpClientAdapter({
    url: RPC_ENDPOINT,
  }),
});

export const rpcClientQuery = createFnRecordQueryProxy(rpcClient);
