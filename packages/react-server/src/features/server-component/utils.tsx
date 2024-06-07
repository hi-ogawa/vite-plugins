// encode flight request as path for the ease of ssg deployment
export const RSC_PATH = "__f.data";
const RSC_PARAM = "__f";

type StreamRequestParam = {
  actionId?: string;
  lastPathname?: string;
  // TODO: refine revalitating each layout layer
  revalidate?: boolean;
};

export function wrapStreamRequestUrl(
  href: string,
  param?: StreamRequestParam,
): URL {
  const url = new URL(href, window.location.href);
  url.pathname = posixJoin(url.pathname, RSC_PATH);
  if (param) {
    url.searchParams.set(RSC_PARAM, JSON.stringify(param));
  }
  return url;
}

export function unwrapStreamRequest(request: Request) {
  const url = new URL(request.url);
  const isStream = url.pathname.endsWith(RSC_PATH);
  if (!isStream) {
    return { url, request };
  }
  url.pathname = url.pathname.slice(0, -RSC_PATH.length) || "/";
  const rawParam = url.searchParams.get(RSC_PARAM);
  url.searchParams.delete(RSC_PARAM);

  return {
    url,
    request: new Request(url, {
      method: request.method,
      headers: request.headers,
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
