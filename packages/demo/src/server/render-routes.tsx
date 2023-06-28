import type { RequestContext } from "@hattip/compose";
import { typedBoolean } from "@hiogawa/utils";
import { globPageRoutes } from "@hiogawa/vite-glob-routes/dist/react-router";
import type { QueryClient } from "@tanstack/react-query";
import React from "react";
import { renderToString } from "react-dom/server";
import { isRouteErrorResponse } from "react-router-dom";
import {
  type StaticHandlerContext,
  StaticRouterProvider,
  createStaticHandler,
  createStaticRouter,
} from "react-router-dom/server";
import { ReactQueryWrapper } from "../utils/react-query-utils";

// cf. https://reactrouter.com/en/main/routers/static-router-provider

const { routes, mapping } = globPageRoutes();

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

  // TODO: "prefetch" link for code-split assets of current matching route? (probe vite manifest?)
  // - https://github.com/remix-run/remix/blob/40a4d7d5e25eb5edc9a622278ab111d881c7c155/packages/remix-react/components.tsx#L885-L895
  // - https://github.com/remix-run/remix/blob/40a4d7d5e25eb5edc9a622278ab111d881c7c155/packages/remix-react/components.tsx#L470-L479
  // - https://github.com/remix-run/remix/pull/3200

  // TODO: we could use "internal handle" to keep the original "module page path",
  //       which then can be resolved to actual client asset path based on vite's client manifest.
  // TODO: or we can probably export this "path mapping" separately from `globPageRoutes`.
  console.log(context.matches);
  mapping;
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
