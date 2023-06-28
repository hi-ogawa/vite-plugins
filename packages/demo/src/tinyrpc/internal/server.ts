import type { RequestContext, RequestHandler } from "@hattip/compose";
import { tinyassert } from "@hiogawa/utils";
import { json } from "react-router-dom";
import {
  type TinyRpcProxy,
  type TinyRpcResponse,
  type TinyRpcRoutesBase,
  Z_TINY_RPC_REQUEST,
} from "./common";
import { createGetterProxy } from "./utils";

export function createTinyRpcHandler({
  endpoint,
  routes,
}: {
  endpoint: string;
  routes: TinyRpcRoutesBase;
}): RequestHandler {
  return async (ctx) => {
    if (ctx.url.pathname !== endpoint) {
      return ctx.next();
    }
    tinyassert(ctx.method === "POST");
    const { path, input } = Z_TINY_RPC_REQUEST.parse(await ctx.request.json());
    const route = routes[path];
    tinyassert(route);
    const data = await route({ input, ctx });
    const response: TinyRpcResponse = { data };
    return json(response);
  };
}

export function createTinyRpcCaller<R extends TinyRpcRoutesBase>({
  ctx,
  routes,
}: {
  ctx: RequestContext;
  routes: TinyRpcRoutesBase;
}): TinyRpcProxy<R> {
  return createGetterProxy((path) => {
    tinyassert(typeof path === "string");
    return async (input: unknown) => {
      const route = routes[path];
      tinyassert(route);
      return route({ input, ctx });
    };
  }) as any;
}
