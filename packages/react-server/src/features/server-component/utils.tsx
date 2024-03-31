// TODO: use accept header x-component?
const RSC_PARAM = "__rsc";

// TODO
export function wrapRscRequestUrl(url: string, newKeys: string[] = []): string {
  const newUrl = new URL(url, window.location.href);
  newUrl.searchParams.set(RSC_PARAM, newKeys.join(","));
  return newUrl.toString();
}

export function unwrapRscRequest(request: Request): Request | undefined {
  const url = new URL(request.url);
  if (url.searchParams.has(RSC_PARAM)) {
    url.searchParams.delete(RSC_PARAM);
    return new Request(url, {
      method: request.method,
      headers: request.headers,
    });
  }
  return;
}
