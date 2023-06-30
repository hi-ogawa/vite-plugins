import { createTrpcClientQueryProxy } from "@hiogawa/query-proxy";
import { createTRPCProxyClient, httpLink } from "@trpc/client";
import { TRPC_ENDPOINT } from "./common";
import { trpcRouter } from "./router";

export const trpcClient = createTRPCProxyClient<typeof trpcRouter>({
  links: [
    httpLink({
      url: TRPC_ENDPOINT,
    }),
  ],
});

export const trpcClientQuery =
  createTrpcClientQueryProxy<typeof trpcRouter>(trpcClient);
