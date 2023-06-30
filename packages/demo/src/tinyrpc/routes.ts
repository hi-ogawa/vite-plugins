import { sleep } from "../utils/misc";
import {
  type FnRecord,
  createReactQueryOptionsProxy,
} from "./internal/react-query";

// can use AsyncLocalStorage to share/access request context

let counter = 0;

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

  checkId_GET: async (id: string) => {
    await sleep(500);
    return { ok: id === "good", message: "rpc" };
  },
} satisfies FnRecord;

export const rpcRoutesQuery = createReactQueryOptionsProxy(rpcRoutes);
