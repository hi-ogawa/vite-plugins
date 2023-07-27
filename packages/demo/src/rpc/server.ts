import { type RequestHandler } from "@hattip/compose";
import { type TinyRpcRoutes, createTinyRpcHandler } from "@hiogawa/tiny-rpc";
import { zodFn } from "@hiogawa/tiny-rpc/dist/zod";
import { tinyassert } from "@hiogawa/utils";
import { z } from "zod";
import { getRequestContext } from "../server/request-context";
import { RPC_ENDPOINT } from "./client";

export const rpcRoutes = {
  login: zodFn(z.object({ name: z.string() }))(async (input) => {
    const ctx = getRequestContext();
    tinyassert(!ctx.session.user);
    ctx.session.user = { name: input.name };
    ctx.commitSession();
  }),

  logout: async () => {
    const ctx = getRequestContext();
    tinyassert(ctx.session.user);
    ctx.session = {};
    ctx.commitSession();
  },
} satisfies TinyRpcRoutes;

export function rpcHandler(): RequestHandler {
  return createTinyRpcHandler({
    endpoint: RPC_ENDPOINT,
    routes: rpcRoutes,
    onError(e) {
      console.error(e);
    },
  });
}
