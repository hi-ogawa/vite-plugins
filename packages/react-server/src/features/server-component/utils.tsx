import { objectPickBy } from "@hiogawa/utils";
import {
  createLayoutContentRequest,
  getNewLayoutContentKeys,
} from "../router/utils";

// TODO: use accept header x-component?
const RSC_PARAM = "__rsc";

// TODO: allow invalidating each layout layer
type StreamRequestParam = {
  lastPathname?: string;
  invalidateAll?: boolean; // currently used for server component HMR
};

export function wrapRscRequestUrl(
  url: string,
  param: StreamRequestParam,
): string {
  const newUrl = new URL(url, window.location.href);
  newUrl.searchParams.set(RSC_PARAM, JSON.stringify(param));
  return newUrl.toString();
}

export function unwrapStreamRequest(request: Request) {
  const url = new URL(request.url);
  const rscParam = url.searchParams.get(RSC_PARAM);
  url.searchParams.delete(RSC_PARAM);

  let layoutRequest = createLayoutContentRequest(url.pathname);
  if (rscParam) {
    const param = JSON.parse(rscParam);
    if (param.lastPathname && !param.invalidateAll) {
      const newKeys = getNewLayoutContentKeys(param.lastPathname, url.pathname);
      layoutRequest = objectPickBy(layoutRequest, (_v, k) =>
        newKeys.includes(k),
      );
    }
  }

  return {
    request: new Request(url, {
      method: request.method,
      headers: request.headers,
    }),
    layoutRequest,
    isStream: Boolean(rscParam),
  };
}
