import { ResponseCookies } from "@edge-runtime/cookies";
import type { RevalidationType } from "../server-component/utils";
import { createContextStorage } from "./utils";

const requestContextStorage = createContextStorage<RequestContext>();

export class RequestContext {
  public cookies: ResponseCookies;
  public revalidate?: RevalidationType;

  constructor(public headers: Headers) {
    this.cookies = new ResponseCookies(headers);
  }

  run<T>(f: () => T): T {
    return requestContextStorage.run(this, f);
  }

  static get() {
    const context = requestContextStorage.getStore();
    if (!context) {
      // tolerate mis usage for now
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
  return RequestContext.get().cookies;
}
