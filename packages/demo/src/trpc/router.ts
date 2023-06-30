import { z } from "zod";
import { sleep } from "../utils/misc";
import { trpcProcedureBuilder, trpcRouterFactory } from "./init";

let counter = 0;

export const trpcRouter = trpcRouterFactory({
  getCounter: trpcProcedureBuilder.query(async () => {
    await sleep(500);
    return counter;
  }),

  updateCounter: trpcProcedureBuilder
    .input(z.number())
    .mutation(async ({ input }) => {
      await sleep(500);
      counter += input;
      return counter;
    }),
});

// expose trpc caller for server loader
export const trpcCaller = trpcRouter.createCaller({});

// TODO
// export const trpcCallerQuery = ...
