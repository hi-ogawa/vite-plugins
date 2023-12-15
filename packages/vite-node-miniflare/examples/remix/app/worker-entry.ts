import * as build from "virtual:remix/server-build";
import { compose } from "@hattip/compose";
import { createRequestHandler } from "@remix-run/server-runtime";

export default {
  fetch: createFetchHandler(),
};

function createFetchHandler() {
  const mode = import.meta.env.DEV ? "development" : "production";
  const remixHandler = createRequestHandler(build, mode);
  const hattipHandler = compose((ctx) => remixHandler(ctx.request));

  return (request: Request, env: any, ctx: any) => {
    // cf. https://github.com/hattipjs/hattip/blob/37f824115c85ef96f6e2b28cfe289f882f225c73/packages/adapter/adapter-cloudflare-workers/src/index.ts
    return hattipHandler({
      request,
      ip: "127.0.0.1",
      waitUntil: ctx.waitUntil.bind(ctx),
      passThrough() {},
      platform: { env },
    });
  };
}
