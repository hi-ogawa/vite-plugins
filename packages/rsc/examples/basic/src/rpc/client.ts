import { httpClientAdapter, proxyTinyRpc } from "@hiogawa/tiny-rpc";
import type { serverRpc } from "./server";

export const clientRpc = proxyTinyRpc<typeof serverRpc>({
  adapter: httpClientAdapter({
    url: "/__rpc",
  }),
});
