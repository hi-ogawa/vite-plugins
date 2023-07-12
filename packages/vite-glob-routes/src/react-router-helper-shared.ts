import { tinyassert } from "@hiogawa/utils";

// TODO: should add a marker at the url level (e.g. remix's "_data" params)
//       so that http caching naturally works.
export const LOADER_REQUEST_HEADER = "x-loader-request";

// TODO
// convention to wrap/unwrap response to propagate redirection/error on client
// e.g. x-loader-status, x-loader-redirect, etc...
// cf. https://github.com/remix-run/remix/blob/8268142371234795491070bafa23cd4607a36529/packages/remix-react/routes.tsx#L210

export function wrapLoaderResult(res: unknown): Response {
  tinyassert(res instanceof Response);
  return res;
}

export function unwrapLoaderResult(res: Response): unknown {
  return res;
}
