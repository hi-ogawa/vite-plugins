import { tinyassert } from "@hiogawa/utils";
import {
  type TinyRpcProxy,
  type TinyRpcRequest,
  type TinyRpcRoutesBase,
  Z_TINY_RPC_RESPONSE,
} from "./common";
import { createGetterProxy } from "./utils";

export function createTinyRpcFetchProxy<R extends TinyRpcRoutesBase>({
  endpoint,
}: {
  endpoint: string;
}): TinyRpcProxy<R> {
  return createGetterProxy((path) => {
    tinyassert(typeof path === "string");
    return async (input: unknown) => {
      const request: TinyRpcRequest = {
        path,
        input,
      };
      const res = await fetch(endpoint, {
        method: "POST",
        body: JSON.stringify(request),
      });
      tinyassert(res.ok);
      const response = Z_TINY_RPC_RESPONSE.parse(await res.json());
      return response.data;
    };
  }) as any;
}
