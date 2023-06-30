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
      const request = encodeInput(url, path, input);
      const res = await fetch(request);
      tinyassert(res.ok);
      const response = Z_TINY_RPC_RESPONSE.parse(await res.json());
      return response.output;
    };
  }) as any;
}

function encodeInput(url: string, path: string, input: unknown) {
  // ad-hoc GET convention
  if (path.endsWith("_GET")) {
    if (typeof input !== "undefined") {
      url += "?input=" + encodeURIComponent(JSON.stringify(input));
    }
    return new Request(url);
  }

  return new Request(url, {
    method: "POST",
    body: JSON.stringify({ input } satisfies TinyRpcRequest),
  });
}
