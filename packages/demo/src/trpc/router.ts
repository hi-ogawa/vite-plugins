import { createFnRecordQueryProxy } from "@hiogawa/query-proxy";
import { z } from "zod";
import { sleep } from "../utils/misc";
import { $t } from "./init";

let counter = 0;

export const trpcRouter = $t.router({
  checkId: $t.procedure.input(z.string()).query(async ({ input }) => {
    await sleep(500);
    return { ok: input === "good", message: "api" };
  }),

  getCounter: $t.procedure.query(async () => {
    await sleep(500);
    return counter;
  }),

  updateCounter: $t.procedure.input(z.number()).mutation(async ({ input }) => {
    await sleep(500);
    counter += input;
    return counter;
  }),
});

// expose trpc caller for server loader
export const trpcCaller = trpcRouter.createCaller({});
export const trpcCallerQuery = createFnRecordQueryProxy(trpcCaller);
