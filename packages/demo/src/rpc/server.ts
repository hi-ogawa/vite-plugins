import { type RequestHandler } from "@hattip/compose";
import { type TinyRpcRoutes, createTinyRpcHandler } from "@hiogawa/tiny-rpc";
import { zodFn } from "@hiogawa/tiny-rpc/dist/zod";
import { tinyassert } from "@hiogawa/utils";
import { viteDevServer } from "@hiogawa/vite-import-dev-server/runtime";
import { z } from "zod";
import { getRequestContext } from "../server/request-context";
import { RPC_ENDPOINT } from "./client";

export const rpcRoutes = {
  login: zodFn(z.object({ name: z.string() }))(async (input) => {
    const ctx = getRequestContext();
    tinyassert(!ctx.session.user, "already logged in");
    ctx.session.user = { name: input.name };
    await ctx.commitSession();
  }),

  logout: async () => {
    const ctx = getRequestContext();
    tinyassert(ctx.session.user, "not logged in");
    ctx.session = {};
    await ctx.commitSession();
  },

  me: async () => {
    const ctx = getRequestContext();
    return ctx.session.user ?? null;
  },
} satisfies TinyRpcRoutes;

export function rpcHandler(): RequestHandler {
  return createTinyRpcHandler({
    endpoint: RPC_ENDPOINT,
    routes: rpcRoutes,
    onError(e) {
      viteDevServer?.ssrFixStacktrace(e as any);
      console.error(e);
    },
  });
}
