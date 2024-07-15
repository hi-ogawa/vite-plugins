import type { RequestContext } from "../request-context/server";
import {
  MIDDLEWARE_NEXT_KEY,
  type NextFetchEvent,
  NextRequest,
  NextResponse,
} from "./request";

// https://nextjs.org/docs/app/api-reference/file-conventions/middleware
// https://nextjs.org/docs/app/building-your-application/routing/middleware

export type MiddlewareModule = {
  default: (
    request: NextRequest,
    event: NextFetchEvent,
  ) => Promise<Response | undefined>;
  // TODO: matcher
  config?: { matcher: string };
};

export async function handleMiddleware(
  mod: MiddlewareModule,
  request: Request,
  requestContext: RequestContext,
): Promise<Response | undefined> {
  // TODO: POST body
  const nextRequest = new NextRequest(request.url, {
    method: request.method,
    headers: request.headers,
  });

  const response = await mod.default(nextRequest, { waitUntil: () => {} });
  if (!response) return;

  if (response instanceof NextResponse) {
    response.headers.set("set-cookie", response.cookies.toString());
  }

  // add up headers to context when `NextResponse.next()`
  if (response.headers.has(MIDDLEWARE_NEXT_KEY)) {
    response.headers.delete(MIDDLEWARE_NEXT_KEY);
    requestContext.mergeResponseHeaders(response.headers);
    return;
  }

  // otherwise respond directly
  return response;
}
