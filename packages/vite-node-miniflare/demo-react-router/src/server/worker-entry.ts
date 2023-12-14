import { compose } from "@hattip/compose";
import { globApiRoutes } from "@hiogawa/vite-glob-routes/dist/hattip";
import { ssrHandler } from "./ssr";

export default {
  fetch: createFetchHandler(),
};

function createFetchHandler() {
  const handler = compose(globApiRoutes(), ssrHandler());

  return (request: Request, env: any, ctx: any) => {
    // cf. https://github.com/hattipjs/hattip/blob/37f824115c85ef96f6e2b28cfe289f882f225c73/packages/adapter/adapter-cloudflare-workers/src/index.ts
    return handler({
      request,
      ip: "127.0.0.1",
      waitUntil: ctx.waitUntil.bind(ctx),
      passThrough() {},
      platform: { env },
    });
  };
}
