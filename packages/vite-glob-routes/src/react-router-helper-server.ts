import { tinyassert, typedBoolean } from "@hiogawa/utils";
import {
  type RouteObject,
  isRouteErrorResponse,
  matchRoutes,
} from "react-router";
import {
  type StaticHandlerContext,
  createStaticHandler,
  createStaticRouter,
} from "react-router-dom/server";
import type { Manifest } from "vite";
import type { RouteObjectWithGlobInfo } from "./react-router-utils";

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

// collect code-split assets of current matching route e.g. for prefetching assets via "modulepreload"
// cf.
// - https://github.com/remix-run/remix/blob/40a4d7d5e25eb5edc9a622278ab111d881c7c155/packages/remix-react/components.tsx#L885-L895
// - https://github.com/remix-run/remix/blob/40a4d7d5e25eb5edc9a622278ab111d881c7c155/packages/remix-react/components.tsx#L470-L479
// - https://github.com/remix-run/remix/pull/3200
// - https://github.com/remix-run/remix/discussions/5378
export function getCurrentRouteAssets({
  context,
  routes,
  manifest,
}: {
  context: StaticHandlerContext;
  routes: RouteObjectWithGlobInfo[];
  manifest?: Manifest;
}): string[] {
  // use "globInfo" to collect local file paths
  const matchedRoutes = matchRoutes(routes, context.location) ?? [];
  const files = matchedRoutes
    .flatMap((m) => m.route.globInfo?.entries.map((e) => !e.isServer && e.file))
    .filter(typedBoolean);

  // use vite manifest to further map local file path to production asset path
  if (manifest) {
    return resolveManifestAssets(files, manifest);
  }
  return files;
}

function resolveManifestAssets(files: string[], manifest: Manifest) {
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

  for (const file of files) {
    // strip "/"
    collectEnryKeysRecursive(file.slice(1));
  }

  return [...entryKeys].map((key) => "/" + manifest[key]!.file);
}
