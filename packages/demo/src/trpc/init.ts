import { initTRPC } from "@trpc/server";

// factory
const t = initTRPC.create();
export const trpcRouterFactory = t.router;
export const trpcMiddlewareFactory = t.middleware;
export const trpcProcedureBuilder = t.procedure;
