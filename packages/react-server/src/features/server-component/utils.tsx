// TODO: use accept header x-component?
const RSC_PARAM = "__rsc";

export function wrapRscRequestUrl(url: string, newKeys: string[] = []): string {
  const newUrl = new URL(url, window.location.href);
  newUrl.searchParams.set(RSC_PARAM, JSON.stringify(newKeys));
  return newUrl.toString();
}

export function unwrapRscRequest(request: Request) {
  const url = new URL(request.url);
  const rscParam = url.searchParams.get(RSC_PARAM);
  if (rscParam) {
    url.searchParams.delete(RSC_PARAM);
    const newKeys: string[] = JSON.parse(rscParam);
    return {
      request: new Request(url, {
        method: request.method,
        headers: request.headers,
      }),
      newKeys,
    };
  }
  return;
}
