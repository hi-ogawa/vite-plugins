import internal from "virtual:@hiogawa/vite-glob-routes/internal/apiRoutes";
import type { RequestHandler } from "@hattip/compose";
import { tinyassert } from "@hiogawa/utils";
import { createParamMatcher, mapKeys } from "./utils";

// cf. https://github.com/hattipjs/hattip/blob/bec153bddec2109507ff385a9db3434718650730/packages/base/router/src/index.ts#L1-L6
declare module "@hattip/compose" {
  interface RequestContextExtensions {
    params: Record<string, string>;
  }
}

export function globApiRoutes() {
  const { root, globApi } = internal;
  const apiModules = mapKeys(
    globApi,
    (k) => k.slice(root.length).match(/^(.*)\.api\./)![1]!,
  );
  return createGlobApiRoutesInner(apiModules);
}

type ApiModule = Partial<
  Record<"get" | "post" | "put" | "delete", RequestHandler>
>;

function createGlobApiRoutesInner(
  apiModules: Record<string, ApiModule>,
): RequestHandler {
  const entries = Object.entries(apiModules).map(([apiRoute, apiModule]) => ({
    matcher: createParamMatcher(apiRoute),
    apiModule,
  }));

  return async (ctx) => {
    for (const e of entries) {
      const match = e.matcher(ctx.url.pathname);
      if (match) {
        const method = ctx.method.toLowerCase();
        const handler = e.apiModule[method as "get"];
        if (handler) {
          tinyassert(typeof handler === "function");
          ctx.params = match.params;
          return handler(ctx);
        }
      }
    }
    return ctx.next();
  };
}
