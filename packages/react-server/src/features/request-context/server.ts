import { createNextCookies } from "../next/cookie";
import type { RevalidationType } from "../server-component/utils";
import { createContextStorage } from "./utils";

const requestContextStorage = createContextStorage<RequestContext>();

export class RequestContext {
  nextCookies: ReturnType<typeof createNextCookies>;
  revalidate?: RevalidationType; // TODO: multiple revlidation paths
  private responseHeaders = new Headers();

  constructor(public requestHeaders: Headers) {
    this.nextCookies = createNextCookies(requestHeaders);
  }

  getResponseHeaders() {
    return {
      ...Object.fromEntries(this.responseHeaders.entries()),
      "set-cookie": this.nextCookies.toSetCookie(),
    };
  }

  mergeResponseHeaders(headers: Headers) {
    // TODO: not sure which should overwrite
    for (const [k, v] of headers) {
      this.responseHeaders.set(k, v);
    }
    this.nextCookies.mergeSetCookie(headers);
  }

  injectResponseHeaders(response: Response): Response {
    this.mergeResponseHeaders(response.headers);
    return new Response(response.body, {
      status: response.status,
      headers: this.getResponseHeaders(),
    });
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
