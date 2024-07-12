import type { RequestContext } from "../request-context/server";
import type { NextRequest, NextResponse } from "./request";

export type MiddlewareModule = {
  middleware: (request: NextRequest) => Promise<NextResponse>;
  config: { matcher: string };
};

export async function handleMiddleware(
  module: MiddlewareModule,
  requestContext: RequestContext,
) {
  module.config.matcher;
  module.middleware;
  requestContext;
}
