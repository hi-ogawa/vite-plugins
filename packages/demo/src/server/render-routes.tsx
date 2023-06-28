import type { RequestContext } from "@hattip/compose";
import { typedBoolean } from "@hiogawa/utils";
import type { QueryClient } from "@tanstack/react-query";
import React from "react";
import { renderToString } from "react-dom/server";
import { type RouteObject, isRouteErrorResponse } from "react-router-dom";
import {
  type StaticHandlerContext,
  StaticRouterProvider,
  createStaticHandler,
  createStaticRouter,
} from "react-router-dom/server";
import { ReactQueryWrapper } from "../utils/react-query-utils";

// cf. https://reactrouter.com/en/main/routers/static-router-provider

type RenderResult =
  | {
      type: "render";
      html: string;
      statusCode: number;
    }
  | {
      type: "response";
      response: Response;
    };

export async function renderRoutes(
  hattipContext: RequestContext,
  routes: RouteObject[],
  queryClient: QueryClient
): Promise<RenderResult> {
  const handler = createStaticHandler(routes);

  const context = await handler.query(hattipContext.request, {
    requestContext: hattipContext,
  });

  // handle redirection in loader
  if (context instanceof Response) {
    return {
      type: "response",
      response: context,
    };
  }

  // probe context for error status (e.g. 404)
  const statusCode = getResponseStatusCode(context);

  const router = createStaticRouter(handler.dataRoutes, context);

  const root = (
    <React.StrictMode>
      <ReactQueryWrapper queryClient={queryClient}>
        <StaticRouterProvider
          router={router}
          context={context}
          // currently "loader" is used only for `queryClient.prefetchQuery`, which allows passing data during SSR and hydration.
          // thus, from react-router context point of view, there should be no data to pass.
          // https://github.com/remix-run/react-router/blob/bc2552840147206716544e5cdcdb54f649f9193f/packages/react-router-dom/server.tsx#L114-L126
          hydrate={false}
        />
      </ReactQueryWrapper>
    </React.StrictMode>
  );

  // TODO: streaming
  const html = renderToString(root);
  return { type: "render", html, statusCode };
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
