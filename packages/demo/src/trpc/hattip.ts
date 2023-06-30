import type { RequestHandler } from "@hattip/compose";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { getServerContext } from "../server/server-context";
import { TRPC_ENDPOINT } from "./common";
import { trpcRouter } from "./router";

export function trpcHattipHandler(): RequestHandler {
  return (ctx) => {
    if (ctx.url.pathname.startsWith(TRPC_ENDPOINT)) {
      return fetchRequestHandler({
        endpoint: TRPC_ENDPOINT,
        req: ctx.request,
        router: trpcRouter,
        createContext: (trpcContext) => {
          // inject trpc context into async context
          const serverContext = getServerContext();
          serverContext.trpcResponseHeaders = trpcContext.resHeaders;
          return {};
        },
        onError: (e) => {
          console.error(e);
        },
      });
    }
    return ctx.next();
  };
}
