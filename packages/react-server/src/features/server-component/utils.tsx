import { objectPickBy } from "@hiogawa/utils";
import {
  createLayoutContentRequest,
  getNewLayoutContentKeys,
} from "../router/utils";
import type { ActionResult } from "../server-action/react-server";

// TODO: use accept header x-component?
const RSC_PARAM = "__rsc";

type StreamRequestParam = {
  lastPathname?: string;
  // TODO: refine revalitating each layout layer
  revalidate?: boolean;
};

export function wrapStreamRequestUrl(
  url: string,
  param: StreamRequestParam,
): string {
  const newUrl = new URL(url, window.location.href);
  newUrl.searchParams.set(RSC_PARAM, JSON.stringify(param));
  return newUrl.toString();
}

export function unwrapStreamRequest(
  request: Request,
  actionResult?: ActionResult,
) {
  const url = new URL(request.url);
  const rscParam = url.searchParams.get(RSC_PARAM);
  url.searchParams.delete(RSC_PARAM);

  let layoutRequest = createLayoutContentRequest(url.pathname);
  if (rscParam && !actionResult?.context.revalidate) {
    const param = JSON.parse(rscParam) as StreamRequestParam;
    if (param.lastPathname && !param.revalidate) {
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
