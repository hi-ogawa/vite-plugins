// encode flight request as path for the ease of ssg deployment
export const RSC_PATH = "__f.data";
const RSC_PARAM = "__f";

const FLIGHT_META = "x-flight-meta";

type StreamRequestParam = {
  actionId?: string;
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
  // TODO: remove params on prerendered paths for better caching
  // TODO: move it to request headers and ssr can return no-cache?
  newUrl.searchParams.set(RSC_PARAM, JSON.stringify(param));
  return newUrl.toString();
}

export function createStreamRequest(href: string, param: StreamRequestParam) {
  const url = new URL(href, window.location.href);
  url.pathname = posixJoin(url.pathname, RSC_PATH);
  return new Request(url, {
    headers: {
      [FLIGHT_META]: JSON.stringify(param),
    },
  });
}

export function unwrapStreamRequest(request: Request) {
  const url = new URL(request.url);
  const isStream = url.pathname.endsWith(RSC_PATH);
  if (!isStream) {
    return { url, request, isStream };
  }
  url.pathname = url.pathname.slice(0, -RSC_PATH.length) || "/";
  const headers = new Headers(request.headers);
  const rawParam = headers.get(FLIGHT_META);
  headers.delete(RSC_PARAM);

  return {
    url,
    request: new Request(url, {
      method: request.method,
      headers,
      body: request.body,
      // @ts-ignore undici
      ...("duplex" in request ? { duplex: "half" } : {}),
    }),
    isStream,
    streamParam: rawParam
      ? (JSON.parse(rawParam) as StreamRequestParam)
      : undefined,
  };
}

// posixJoin("/", "new") === "/new"
// posixJoin("/", "/new") === "/new"
// posixJoin("/xyz", "new") === "/xyz/new"
// posixJoin("/xyz", "/new") === "/xyz/new"
function posixJoin(...args: string[]) {
  return args.join("/").replace(/\/\/+/g, "/");
}
