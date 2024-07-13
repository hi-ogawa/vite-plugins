import type { RequestContext } from "../request-context/server";
import type { NextRequest, NextResponse } from "./request";

// https://nextjs.org/docs/app/api-reference/file-conventions/middleware

// first goal is to support next-auth
// https://github.com/nextauthjs/next-auth/blob/a3d3d4bab3e037a5359ed22de8b1fff0b5557523/packages/next-auth/src/index.ts#L86
// https://github.com/nextauthjs/next-auth/blob/a3d3d4bab3e037a5359ed22de8b1fff0b5557523/packages/next-auth/src/lib/index.ts#L3

export type MiddlewareModule = {
  middleware: (request: NextRequest) => Promise<NextResponse>;
  config?: { matcher: string };
};

export async function handleMiddleware(
  { middleware, config }: MiddlewareModule,
  requestContext: RequestContext,
) {
  // TODO: matcher
  config?.matcher;

  // TODO
  // NextRequest
  // NextResponse (redirect, next)
  middleware;
  requestContext;
}
