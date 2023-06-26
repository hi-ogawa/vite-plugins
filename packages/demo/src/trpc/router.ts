import { z } from "zod";
import { trpcProcedureBuilder, trpcRouterFactory } from "./init";

let counter = 0;

export const trpcRouter = trpcRouterFactory({
  getCounter: trpcProcedureBuilder.query(() => {
    return counter;
  }),

  updateCounter: trpcProcedureBuilder
    .input(
      z.object({
        delta: z.number(),
      })
    )
    .mutation(({ input }) => {
      counter += input.delta;
      return counter;
    }),
});
