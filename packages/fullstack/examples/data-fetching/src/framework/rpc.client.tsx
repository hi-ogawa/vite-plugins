import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";

const link = new RPCLink({
  url: () => `${window.location.origin}/rpc`,
});

globalThis.$rpc = createORPCClient(link);
globalThis.$rpcq = createTanstackQueryUtils($rpc);
