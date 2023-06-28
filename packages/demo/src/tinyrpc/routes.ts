import { sleep } from "../utils/misc";
import type { TinyRpcRoutesBase } from "./internal/common";

let counter = 0;

export const tinyRpcRoutes = {
  getCounter: async () => {
    await sleep(500);
    return counter;
  },

  updateCounter: async ({ input }: { input: { delta: number } }) => {
    await sleep(500);
    counter += input.delta;
    return counter;
  },

  checkId: async ({ input }: { input: { id: string } }) => {
    await sleep(500);
    const ok = input.id === "good";
    return { ok, message: "rpc" };
  },
} satisfies TinyRpcRoutesBase;
