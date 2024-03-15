import {
  exposeTinyRpc,
  httpServerAdapter,
  validateFn,
} from "@hiogawa/tiny-rpc";
import { tinyassert } from "@hiogawa/utils";
import { z } from "zod";
import { logError } from "../server/log";
import { getRequestContext } from "../server/request-context";
import { RPC_ENDPOINT } from "./client";

export const rpcRoutes = {
  login: validateFn(z.object({ name: z.string() }))(async (input) => {
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
};

export function rpcHandler() {
  return exposeTinyRpc({
    routes: rpcRoutes,
    adapter: httpServerAdapter({
      endpoint: RPC_ENDPOINT,
      onError(e) {
        logError(e);
      },
    }),
  });
}
