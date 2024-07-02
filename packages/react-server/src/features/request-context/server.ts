import { RequestCookies, ResponseCookies } from "@edge-runtime/cookies";
import type { RevalidationType } from "../server-component/utils";
import { createContextStorage } from "./utils";

const requestContextStorage = createContextStorage<RequestContext>();

export class RequestContext {
  public requestCookies: RequestCookies;
  public responseCookies: ResponseCookies;

  // TODO: multiple revlidation paths
  public revalidate?: RevalidationType;

  constructor(public headers: Headers) {
    // TODO: refactor
    // it seems Next.js's cookies API has to track modified response cookies
    // so that mutable `cookies()` allows reading current cookies as well.
    // https://github.com/vercel/next.js/blob/6795597a50112c4f83bf61caf3681e95816da4c9/packages/next/src/server/web/spec-extension/adapters/request-cookies.ts#L25-L33
    // for now, we just diff two cookies at the end to decide final set-cookie headers
    this.requestCookies = new RequestCookies(headers);
    this.responseCookies = new ResponseCookies(new Headers());
    for (const cookie of this.requestCookies.getAll()) {
      this.responseCookies.set(cookie);
    }
  }

  getSetCookie() {
    const result = new ResponseCookies(new Headers());
    for (const cookie of this.responseCookies.getAll()) {
      const reqCookie = this.requestCookies.get(cookie.name);
      if (reqCookie?.value !== cookie.value) {
        result.set(cookie);
      }
    }
    return result.toString();
  }

  run<T>(f: () => T): T {
    return requestContextStorage.run(this, f);
  }

  static get() {
    const context = requestContextStorage.getStore();
    if (!context) {
      // we should tolerate non-existing context
      // since async storage is not well supported on stackblitz
      console.error("[WARNING] RequestContext not available");
      return new RequestContext(new Headers());
    }
    return context;
  }
}

export function headers() {
  return RequestContext.get().headers;
}

export function cookies() {
  return RequestContext.get().responseCookies;
}

export function revalidatePath(path: string) {
  RequestContext.get().revalidate = path;
}
