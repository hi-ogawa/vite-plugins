import type { RequestHandler } from "@hattip/compose";
import { tinyassert } from "@hiogawa/utils";
import { mapKeys } from "./utils";

type ApiModule = Partial<
  Record<"get" | "post" | "put" | "delete", RequestHandler>
>;

export function createGlobApiRoutes(
  root: string,
  globApi: Record<string, ApiModule>
): RequestHandler {
  globApi = mapKeys(
    globApi,
    (k) => k.slice(root.length).match(/^(.*)\.api\./)![1]!
  );
  return createGlobApiRoutesInner(globApi);
}

export function createGlobApiRoutesInner(
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
