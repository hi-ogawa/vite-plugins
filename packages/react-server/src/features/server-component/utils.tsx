// encode flight request as path for the ease of ssg deployment
export const RSC_PATH = "__f.data";
const RSC_PARAM = "__f";

type StreamRequestParam = {
  actionId?: string;
  lastPathname?: string;
  // TODO: refine revalitating each layout layer
  revalidate?: boolean;
};

export function createStreamRequest(href: string, param: StreamRequestParam) {
  const url = new URL(href, window.location.href);
  url.pathname = posixJoin(url.pathname, RSC_PATH);
  url.searchParams.set(RSC_PARAM, JSON.stringify(param));
  return new Request(url);
}

export function unwrapStreamRequest(request: Request) {
  const url = new URL(request.url);
  const isStream = url.pathname.endsWith(RSC_PATH);
  if (!isStream) {
    return { url, request, isStream };
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
