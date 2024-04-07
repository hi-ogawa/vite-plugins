// TODO: use accept header x-component?
const RSC_PARAM = "__rsc";

// TODO: allow invalidating each layout layer
type StreamRequestParam = {
  lastPathname?: string;
  invalidateAll?: boolean;
};

export function wrapRscRequestUrl(
  url: string,
  param: StreamRequestParam,
): string {
  const newUrl = new URL(url, window.location.href);
  newUrl.searchParams.set(RSC_PARAM, JSON.stringify(param));
  return newUrl.toString();
}

export function unwrapRscRequest(request: Request) {
  const url = new URL(request.url);
  const rscParam = url.searchParams.get(RSC_PARAM);
  if (rscParam) {
    url.searchParams.delete(RSC_PARAM);
    return {
      request: new Request(url, {
        method: request.method,
        headers: request.headers,
      }),
      param: JSON.parse(rscParam) as StreamRequestParam,
    };
  }
  return;
}
