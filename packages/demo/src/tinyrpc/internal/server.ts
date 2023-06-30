import type { RequestHandler } from "@hattip/compose";
import { tinyassert } from "@hiogawa/utils";
import { json } from "react-router-dom";
import { type TinyRpcResponse, Z_TINY_RPC_REQUEST } from "./common";
import type { FnRecord } from "./react-query";

export function createTinyRpcHandler({
  endpoint,
  routes,
}: {
  endpoint: string;
  routes: FnRecord;
}): RequestHandler {
  return async (ctx) => {
    if (ctx.url.pathname !== endpoint) {
      return ctx.next();
    }
    tinyassert(ctx.method === "POST");
    const { path, input } = Z_TINY_RPC_REQUEST.parse(await ctx.request.json());
    const route = routes[path];
    tinyassert(route);
    const output = await route(input);
    const response: TinyRpcResponse = { output };
    return json(response);
  };
}
