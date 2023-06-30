import type { RequestContext, RequestHandler } from "@hattip/compose";
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
    if (!ctx.url.pathname.startsWith(endpoint)) {
      return ctx.next();
    }
    const path = ctx.url.pathname.slice(endpoint.length + 1);
    const route = routes[path];
    tinyassert(route);
    const input = await decodeInput(path, ctx);
    const output = await route(input);
    const response: TinyRpcResponse = { output };
    return json(response);
  };
}

async function decodeInput(
  path: string,
  ctx: RequestContext
): Promise<unknown> {
  // ad-hoc GET convention
  if (path.endsWith("_GET")) {
    tinyassert(ctx.method === "GET");
    const rawInput = ctx.url.searchParams.get("input");
    if (rawInput) {
      return JSON.parse(rawInput);
    }
    return;
  }

  tinyassert(ctx.method === "POST");
  const rpcRequest = Z_TINY_RPC_REQUEST.parse(await ctx.request.json());
  return rpcRequest.input;
}
