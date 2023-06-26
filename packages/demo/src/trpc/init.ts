import { initTRPC } from "@trpc/server";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";

// factory
const t = initTRPC.context<TrpcContext>().create();
export const trpcRouterFactory = t.router;
export const trpcMiddlewareFactory = t.middleware;
export const trpcProcedureBuilder = t.procedure;

// context
type TrpcContext = Awaited<ReturnType<typeof createTrpcContext>>;

export async function createTrpcContext(options: FetchCreateContextFnOptions) {
  return options;
}
