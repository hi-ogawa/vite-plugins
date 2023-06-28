import type { RequestContext } from "@hattip/compose";
import { tinyassert, typedBoolean } from "@hiogawa/utils";
import {
  type RouteObjectWithGlobInfo,
  globPageRoutes,
} from "@hiogawa/vite-glob-routes/dist/react-router";
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
import type { Manifest } from "vite";
import { ReactQueryWrapper } from "../utils/react-query-utils";

// cf. https://reactrouter.com/en/main/routers/static-router-provider

const { routes } = globPageRoutes();

type RenderResult =
  | {
      type: "render";
      html: string;
      // expose StaticHandlerContext and compute followings outside of `renderRoutes`?
      statusCode: number;
      routeFiles: string[];
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

  return {
    type: "render",
    html,
    statusCode: getResponseStatusCode(context),
    routeFiles: await getMatchedRouteFiles(context),
  };
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

// prefetch code-split assets of current matching route, cf.
// - https://github.com/remix-run/remix/blob/40a4d7d5e25eb5edc9a622278ab111d881c7c155/packages/remix-react/components.tsx#L885-L895
// - https://github.com/remix-run/remix/blob/40a4d7d5e25eb5edc9a622278ab111d881c7c155/packages/remix-react/components.tsx#L470-L479
// - https://github.com/remix-run/remix/pull/3200
// - https://github.com/remix-run/remix/discussions/5378
async function getMatchedRouteFiles(
  context: StaticHandlerContext
): Promise<string[]> {
  // use "globInfo" to collect local file paths
  const matchedFiles = context.matches
    .flatMap((m) =>
      (m.route as RouteObjectWithGlobInfo).globInfo?.entries.map((e) => e.file)
    )
    .filter(typedBoolean);

  if (!import.meta.env.PROD) {
    return matchedFiles;
  }

  // use vite manifest to further map local file path to production asset path
  // @ts-expect-error
  const manifest: Manifest = (await import("/dist/client/manifest.json"))
    .default;

  // collect manifest entries
  const entryKeys = new Set<string>();

  function collectEnryKeysRecursive(key: string) {
    if (!entryKeys.has(key)) {
      const e = manifest[key];
      tinyassert(e);
      entryKeys.add(key);
      for (const nextKey of e.imports ?? []) {
        collectEnryKeysRecursive(nextKey);
      }
    }
  }

  for (const file of matchedFiles) {
    // strip "/"
    collectEnryKeysRecursive(file.slice(1));
  }

  return [...entryKeys].map((key) => "/" + manifest[key]!.file);
}
