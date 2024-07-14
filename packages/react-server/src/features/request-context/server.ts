import { createNextCookies } from "../next/cookie";
import type { RevalidationType } from "../server-component/utils";
import { createContextStorage } from "./utils";

const requestContextStorage = createContextStorage<RequestContext>();

export class RequestContext {
  nextCookies: ReturnType<typeof createNextCookies>;
  responseHeaders: Headers = new Headers();

  // TODO: multiple revlidation paths
  revalidate?: RevalidationType;

  constructor(public requestHeaders: Headers) {
    this.nextCookies = createNextCookies(requestHeaders);
  }

  getSetCookie = () => this.nextCookies.toResponseCookies().toString();

  getResponseHeaders() {
    return {
      ...Object.fromEntries(this.responseHeaders.entries()),
      "set-cookie": this.nextCookies.toResponseCookies().toString(),
    };
  }

  run<T>(f: () => T): T {
    return requestContextStorage.run(this, f);
  }
}

function getRequestContext() {
  const context = requestContextStorage.getStore();
  if (!context) {
    // we tolerate non-existing context
    // since async storage is not well supported on stackblitz
    console.error("[WARNING] RequestContext not available");
    return new RequestContext(new Headers());
  }
  return context;
}

export function headers() {
  return getRequestContext().requestHeaders;
}

export function cookies() {
  return getRequestContext().nextCookies.cookies;
}

export function revalidatePath(path: string) {
  getRequestContext().revalidate = path;
}
