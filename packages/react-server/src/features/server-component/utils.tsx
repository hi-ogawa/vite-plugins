import { objectPickBy } from "@hiogawa/utils";
import {
  createLayoutContentRequest,
  getNewLayoutContentKeys,
} from "../router/utils";
import type { ActionResult } from "../server-action/react-server";

// encode flight request as path for the ease of ssg deployment
const RSC_PATH = "__f.data";
const RSC_PARAM = "__f";

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
  newUrl.pathname = posixJoin(newUrl.pathname, RSC_PATH);
  newUrl.searchParams.set(RSC_PARAM, JSON.stringify(param));
  return newUrl.toString();
}

export function unwrapStreamRequest(
  request: Request,
  actionResult?: ActionResult,
) {
  const url = new URL(request.url);
  let isStream = false;
  if (url.pathname.endsWith(RSC_PATH)) {
    isStream = true;
    url.pathname = url.pathname.slice(0, -RSC_PATH.length) || "/";
  }
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
    isStream,
  };
}

// posixJoin("/", "new") === "/new"
// posixJoin("/", "/new") === "/new"
// posixJoin("/xyz", "new") === "/xyz/new"
// posixJoin("/xyz", "/new") === "/xyz/new"
function posixJoin(...args: string[]) {
  return args.join("/").replace(/\/\/+/g, "/");
}
