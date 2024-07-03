import { RequestCookies, ResponseCookies } from "@edge-runtime/cookies";

// it seems Next.js's cookies API has to track modified response cookies
// so that mutable `cookies()` allows reading current cookies at the same time.
// https://github.com/vercel/next.js/blob/6795597a50112c4f83bf61caf3681e95816da4c9/packages/next/src/server/web/spec-extension/adapters/request-cookies.ts#L25-L33
// for now, we just diff two cookies at the end to decide final set-cookie header
export function createNextCookies(requestHeaders: Headers) {
  const requestCookies = new RequestCookies(requestHeaders);
  const cookies = new ResponseCookies(new Headers());
  for (const cookie of requestCookies.getAll()) {
    cookies.set(cookie);
  }

  function toResponseCookies() {
    const responseCookies = new ResponseCookies(new Headers());
    for (const cookie of cookies.getAll()) {
      const reqCookie = requestCookies.get(cookie.name);
      if (reqCookie?.value !== cookie.value) {
        responseCookies.set(cookie);
      }
    }
    return responseCookies;
  }

  return { cookies, toResponseCookies };
}

export function injectResponseCookies(
  response: Response,
  cookies: ResponseCookies,
): Response {
  const entries = cookies.getAll();
  if (entries.length === 0) {
    return response;
  }
  const responseCookies = new ResponseCookies(response.headers);
  for (const entry of entries) {
    responseCookies.set(entry);
  }
  const headers = new Headers(response.headers);
  headers.set("set-cookie", responseCookies.toString());
  return new Response(response.body, {
    ...response,
    headers,
  });
}
