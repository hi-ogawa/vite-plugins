import internal from "virtual:@hiogawa/vite-glob-routes/internal/api-routes";
import type { RequestHandler } from "@hattip/compose";
import { tinyassert } from "@hiogawa/utils";
import { mapKeys } from "./utils";

export function globApiRoutes() {
  const { root, globApi } = internal;
  const apiModules = mapKeys(
    globApi,
    (k) => k.slice(root.length).match(/^(.*)\.api\./)![1]!
  );
  return createGlobApiRoutesInner(apiModules);
}

type ApiModule = Partial<
  Record<"get" | "post" | "put" | "delete", RequestHandler>
>;

function createGlobApiRoutesInner(
  apiModules: Record<string, ApiModule>
): RequestHandler {
  return async (ctx) => {
    const apiModule = apiModules[ctx.url.pathname];
    if (apiModule) {
      const method = ctx.method.toLowerCase();
      const handler = apiModule[method as "get"];
      if (handler) {
        tinyassert(typeof handler === "function");
        return handler(ctx);
      }
    }
    return ctx.next();
  };
}
