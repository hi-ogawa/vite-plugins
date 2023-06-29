import { typedBoolean } from "@hiogawa/utils";
import React from "react";
import { type RouteObject, isRouteErrorResponse } from "react-router-dom";
import {
  type StaticHandlerContext,
  StaticRouterProvider,
  createStaticHandler,
  createStaticRouter,
} from "react-router-dom/server";

// cf. https://reactrouter.com/en/main/routers/static-router-provider

// TODO: move this helper to vite-glob-routes

// export async function hanldeServerGlobPageRoutes() {
// }

type ServerRouterResult =
  | {
      type: "render";
      context: StaticHandlerContext; // error, matches, etc.. provide extra info for e.g. http status code, modulepreload script, etc...
      element: React.ReactElement;
      statusCode: number;
    }
  | {
      type: "response";
      response: Response;
    };

export async function handleServerRouter({
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

  const element = (
    <StaticRouterProvider
      router={createStaticRouter(handler.dataRoutes, context)}
      context={context}
    />
  );

  // probe context for error status (e.g. 404)
  const statusCode = getResponseStatusCode(context);

  return { type: "render", context, element, statusCode };
}

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
