import type { RequestContext } from "../request-context/server";
import { NEXT_HANDLER_KEY, NextRequest, NextResponse } from "./request";

// https://nextjs.org/docs/app/api-reference/file-conventions/middleware

// first goal is to support next-auth
// https://github.com/nextauthjs/next-auth/blob/a3d3d4bab3e037a5359ed22de8b1fff0b5557523/packages/next-auth/src/index.ts#L86
// https://github.com/nextauthjs/next-auth/blob/a3d3d4bab3e037a5359ed22de8b1fff0b5557523/packages/next-auth/src/lib/index.ts#L3

export type MiddlewareModule = {
  middleware: (request: NextRequest) => Promise<Response>;
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

  const response = await middleware(nextRequest);
  if (response instanceof NextResponse) {
    response.headers.set("set-cookie", response.cookies.toString());
  }

  // add up headers to context if `NextResponse.next()`
  if (response.headers.has(NEXT_HANDLER_KEY)) {
    // TODO
    requestContext;
    return;
  }

  // otherwise respond directly
  return response;
}
