import { sleep } from "../utils/misc";
import {
  type FnRecord,
  createReactQueryOptionsProxy,
} from "./internal/react-query";

let counter = 0;

// use AsyncLocalStorage to share/access request context

export const rpcRoutes = {
  getCounter: async () => {
    await sleep(500);
    return counter;
  },

  updateCounter: async (delta: number) => {
    await sleep(500);
    counter += delta;
    return counter;
  },

  checkId: async (id: string) => {
    await sleep(500);
    return { ok: id === "good", message: "rpc" };
  },
} satisfies FnRecord;

export const rpcRoutesQuery = createReactQueryOptionsProxy(rpcRoutes);
