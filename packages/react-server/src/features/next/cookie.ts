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

  function mergeSetCookie(headers: Headers) {
    const newCookies = new ResponseCookies(headers);
    for (const cookie of newCookies.getAll()) {
      cookies.set(cookie);
    }
  }

  function toSetCookie() {
    return toResponseCookies().toString();
  }

  return { cookies, mergeSetCookie, toSetCookie };
}
