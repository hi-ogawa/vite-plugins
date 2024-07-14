import { ResponseCookies } from "@edge-runtime/cookies";
import type { RequestContext } from "../request-context/server";
import {
  MIDDLEWARE_NEXT_KEY,
  type NextFetchEvent,
  NextRequest,
  NextResponse,
} from "./request";

// https://nextjs.org/docs/app/api-reference/file-conventions/middleware
// https://nextjs.org/docs/app/building-your-application/routing/middleware

// first goal is to support next-auth
// https://github.com/nextauthjs/next-auth/blob/a3d3d4bab3e037a5359ed22de8b1fff0b5557523/packages/next-auth/src/index.ts#L86
// https://github.com/nextauthjs/next-auth/blob/a3d3d4bab3e037a5359ed22de8b1fff0b5557523/packages/next-auth/src/lib/index.ts#L3

export type MiddlewareModule = {
  middleware: (
    request: NextRequest,
    event: NextFetchEvent,
  ) => Promise<Response | undefined>;
  config?: { matcher: string };
};

export async function handleMiddleware(
  { middleware, config }: MiddlewareModule,
  request: Request,
  requestContext: RequestContext,
): Promise<Response | undefined> {
  // TODO: matcher
  config?.matcher;

  // TODO: POST body
  const nextRequest = new NextRequest(request.url, {
    method: request.method,
    headers: request.headers,
  });

  const response = await middleware(nextRequest, { waitUntil: () => {} });
  if (!response) return;

  if (response instanceof NextResponse) {
    response.headers.set("set-cookie", response.cookies.toString());
  }

  // add up headers to context when `NextResponse.next()`
  if (response.headers.has(MIDDLEWARE_NEXT_KEY)) {
    response.headers.delete(MIDDLEWARE_NEXT_KEY);
    const cookies = new ResponseCookies(response.headers);
    for (const cookie of cookies.getAll()) {
      requestContext.nextCookies.cookies.set(cookie);
    }
    for (const [k, v] of response.headers) {
      requestContext.responseHeaders.set(k, v);
    }
    return;
  }

  // otherwise respond directly
  return response;
}
