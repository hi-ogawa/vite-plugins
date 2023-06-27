import type { RequestHandler } from "@hattip/compose";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { TRPC_ENDPOINT } from "./common";
import { createTrpcContext } from "./init";
import { trpcRouter } from "./router";

export function trpcHattipHandler(): RequestHandler {
  return (ctx) => {
    if (ctx.url.pathname.startsWith(TRPC_ENDPOINT)) {
      return fetchRequestHandler({
        endpoint: TRPC_ENDPOINT,
        req: ctx.request,
        router: trpcRouter,
        createContext: createTrpcContext,
        onError: (e) => {
          console.error(e);
        },
      });
    }
    return ctx.next();
  };
}
