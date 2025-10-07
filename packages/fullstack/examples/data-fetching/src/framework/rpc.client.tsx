import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";

const link = new RPCLink({
  url: () => `${window.location.origin}/rpc`,
});

globalThis.$rpc = createORPCClient(link);
