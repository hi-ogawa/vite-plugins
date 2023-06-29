import { typedBoolean } from "@hiogawa/utils";
import { type RouteObject, isRouteErrorResponse } from "react-router";
import {
  type StaticHandlerContext,
  createStaticHandler,
  createStaticRouter,
} from "react-router-dom/server";

// why is this not exposed?
type RemixRouter = ReturnType<typeof createStaticRouter>;

type ServerRouterResult =
  | {
      type: "render";
      context: StaticHandlerContext;
      router: RemixRouter;
      statusCode: number;
    }
  | {
      type: "response";
      response: Response;
    };

export async function handleReactRouterServer({
  routes,
  request,
  requestContext,
}: {
  routes: RouteObject[];
  request: Request;
  requestContext: unknown; // provide app local context to server loader
}): Promise<ServerRouterResult> {
  const handler = createStaticHandler(routes);

  const context = await handler.query(request, { requestContext });

  // handle direct loader repsonse e.g. redirection
  if (context instanceof Response) {
    return {
      type: "response",
      response: context,
    };
  }

  return {
    type: "render",
    context,
    router: createStaticRouter(handler.dataRoutes, context),
    statusCode: getResponseStatusCode(context),
  };
}

// probe context for error status (e.g. 404)
function getResponseStatusCode(context: StaticHandlerContext): number {
  if (context.errors) {
    const errorResponses = Object.values(context.errors)
      .map((e) => isRouteErrorResponse(e) && e)
      .filter(typedBoolean);
    if (errorResponses.length) {
      return Math.max(...errorResponses.map((e) => e.status));
    }
    return 500;
  }
  return 200;
}
