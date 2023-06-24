import React from "react";
import { renderToString } from "react-dom/server";
import type { RouteObject } from "react-router-dom";
import {
  StaticRouterProvider,
  createStaticHandler,
  createStaticRouter,
} from "react-router-dom/server";

// cf. https://reactrouter.com/en/main/routers/static-router-provider

export async function renderRoutes(
  request: Request,
  routes: RouteObject[]
): Promise<string | Response> {
  const handler = createStaticHandler(routes);

  // since we don't have any loader side-effect, this context construction should be simple.
  // still this probably handles "not found" error.
  // https://github.com/remix-run/react-router/blob/bc2552840147206716544e5cdcdb54f649f9193f/packages/router/router.ts#L2608
  const context = await handler.query(request);
  if (context instanceof Response) {
    return context;
  }

  const router = createStaticRouter(handler.dataRoutes, context);

  const root = (
    <React.StrictMode>
      {/* there should be no data for server to pass https://github.com/remix-run/react-router/blob/bc2552840147206716544e5cdcdb54f649f9193f/packages/react-router-dom/server.tsx#L114-L126 */}
      <StaticRouterProvider router={router} context={context} hydrate={false} />
    </React.StrictMode>
  );

  // TODO: streaming
  const result = renderToString(root);
  return result;
}
