import { tinyassert } from "@hiogawa/utils";
import type { ImportManifestEntry, ModuleMap } from "./types";

export const moduleMap: ModuleMap = new Proxy(
  {},
  {
    get(_target, id, _receiver) {
      return new Proxy(
        {},
        {
          get(_target, name, _receiver) {
            console.log("[moduleMap]", { id, name });
            tinyassert(typeof id === "string");
            tinyassert(typeof name === "string");
            return {
              id,
              name,
              chunks: [],
            } satisfies ImportManifestEntry;
          },
        }
      );
    },
  }
);

const RSC_PATH = "/__rsc__";

export function wrapRscRequest(url: string): string {
  return RSC_PATH + url;
}

export function unwrapRscRequest(request: Request): Request | undefined {
  const url = new URL(request.url);
  if (url.pathname.startsWith(RSC_PATH)) {
    const newUrl = new URL(url);
    newUrl.pathname = url.pathname.slice(RSC_PATH.length);
    return new Request(newUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });
  }
  return;
}
