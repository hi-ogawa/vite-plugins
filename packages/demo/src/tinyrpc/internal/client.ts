import { tinyassert } from "@hiogawa/utils";
import { type TinyRpcRequest, Z_TINY_RPC_RESPONSE } from "./common";
import type { FnRecord, FnRecordToAsync } from "./react-query";
import { createGetterProxy } from "./utils";

export function createTinyRpcFetchProxy<R extends FnRecord>({
  endpoint,
}: {
  endpoint: string;
}): FnRecordToAsync<R> {
  return createGetterProxy((path) => {
    tinyassert(typeof path === "string");
    return async (input: unknown) => {
      const url = [endpoint, path].join("/");
      const request: TinyRpcRequest = { input };
      const res = await fetch(url, {
        method: "POST",
        body: JSON.stringify(request),
      });
      tinyassert(res.ok);
      const response = Z_TINY_RPC_RESPONSE.parse(await res.json());
      return response.output;
    };
  }) as any;
}
