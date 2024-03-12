import { exposeTinyRpc, httpServerAdapter } from "@hiogawa/tiny-rpc";

let __counter = 0;

export const serverRpc = {
  getCounter: async () => {
    return __counter;
  },
  incrementCounter: async (delta: number) => {
    __counter += delta;
    return __counter;
  },
};

export const rpcHandler = exposeTinyRpc({
  routes: serverRpc,
  adapter: httpServerAdapter({
    endpoint: "/__rpc",
    onError(e) {
      console.error(e);
    },
  }),
});

// TODO: virtual re-exports plugin?
// declare module "virtual:rpc" {
//   export const rpc: typeof import("./server")["serverRpc"];
// }

// TODO: server-action like transform trick?
