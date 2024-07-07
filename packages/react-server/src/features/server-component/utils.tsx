// encode flight request as path for the ease of ssg deployment
export const RSC_PATH = "__f.data";
const RSC_PARAM = "x-flight-meta";

export type RevalidationType = string;

export type StreamRequestParam = {
  actionId?: string;
  // TODO: browser can send all cached route ids?
  lastPathname?: string;
  revalidate?: RevalidationType;
};

export function createStreamRequest(href: string, param: StreamRequestParam) {
  const url = new URL(href, window.location.href);
  url.pathname += RSC_PATH;
  return new Request(url, {
    headers: {
      [RSC_PARAM]: JSON.stringify(param),
    },
  });
}

export function unwrapStreamRequest(request: Request) {
  const url = new URL(request.url);
  const isStream = url.pathname.endsWith(RSC_PATH);
  if (!isStream) {
    return { url, request, isStream };
  }
  url.pathname = url.pathname.slice(0, -RSC_PATH.length);
  const headers = new Headers(request.headers);
  const rawParam = headers.get(RSC_PARAM);
  headers.delete(RSC_PARAM);

  return {
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
