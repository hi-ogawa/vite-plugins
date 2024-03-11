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

const RSC_PARAM = "__rsc";

export function wrapRscRequestUrl(url: string): string {
  const newUrl = new URL(url, window.location.href);
  newUrl.searchParams.set(RSC_PARAM, "1");
  return newUrl.toString();
}

export function unwrapRscRequest(request: Request): Request | undefined {
  const url = new URL(request.url);
  if (url.searchParams.has(RSC_PARAM)) {
    url.searchParams.delete(RSC_PARAM);
    return new Request(url, request);
  }
  return;
}

const RENDER_ID_SEP = "?__renderId=";

export function wrapRenderId(id: string, tag: string) {
  if (import.meta.env.DEV) {
    return `${id}${RENDER_ID_SEP}${tag}`;
  }
  return id;
}

export function unwrapRenderId(id: string) {
  return id.split(RENDER_ID_SEP) as [string, string];
}
