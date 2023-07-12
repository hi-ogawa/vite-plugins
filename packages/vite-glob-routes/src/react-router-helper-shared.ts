import { tinyassert } from "@hiogawa/utils";

// special marker for server to differentiate direct loader request
const LODER_MARKER = "_data.json";

export function wrapLoaderRequest(req: Request): Request {
  const url = new URL(req.url);
  url.pathname += LODER_MARKER;
  return new Request(url);
}

export function unwrapLoaderRequest(req: Request): Request | undefined {
  const url = new URL(req.url);
  if (url.pathname.endsWith(LODER_MARKER)) {
    url.pathname = url.pathname.slice(0, -LODER_MARKER.length);
    return new Request(url, req);
  }
  return;
}

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
