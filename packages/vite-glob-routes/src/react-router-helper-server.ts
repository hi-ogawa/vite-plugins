import { tinyassert, typedBoolean } from "@hiogawa/utils";
import { isRouteErrorResponse } from "react-router";
import {
  type StaticHandlerContext,
  createStaticHandler,
  createStaticRouter,
} from "react-router-dom/server";
import type { Manifest } from "vite";
import {
  type ExtraRouterInfo,
  KEY_extraRouterInfo,
  createGlobalScript,
  stripMatch,
  unwrapLoaderRequest,
  wrapLoaderResult,
} from "./react-router-helper-shared";
import type { GlobPageRoutesResult } from "./react-router-utils";
import { mapValues } from "./utils";

// why is this not exposed?
type RemixRouter = ReturnType<typeof createStaticRouter>;

type ServerRouterResult =
  | {
      type: "render";
      context: StaticHandlerContext;
      router: RemixRouter;
      statusCode: number;
      extraRouterInfo: ExtraRouterInfo;
      extraRouterInfoScript: string;
      assetPaths: string[];
    }
  | {
      type: "response";
      response: Response;
    };

export async function handleReactRouterServer({
  routes,
  routesMeta,
  request,
  requestContext,
}: {
  routes: GlobPageRoutesResult["routes"];
  routesMeta: GlobPageRoutesResult["routesMeta"];
  request: Request;
  requestContext?: unknown; // provide app local context to server loader
}): Promise<ServerRouterResult> {
  const handler = createStaticHandler(routes);

  // handle direct server loader request (aka data request) https://github.com/remix-run/remix/blob/8268142371234795491070bafa23cd4607a36529/packages/remix-server-runtime/server.ts#L136-L139
  const loaderRequest = unwrapLoaderRequest(request);
  if (loaderRequest) {
    const loaderResult = await handler.queryRoute(loaderRequest, {
      requestContext,
    });
    return {
      type: "response",
      response: wrapLoaderResult(loaderResult),
    };
  }

  // handle react-router SSR request
  const context = await handler.query(request, { requestContext });

  // handle non-render repsonse by loader (e.g. redirection)
  if (context instanceof Response) {
    return {
      type: "response",
      response: context,
    };
  }

  // extra runtime info
  const extraRouterInfo: ExtraRouterInfo = {
    matches: context.matches.map((m) => stripMatch(m)),
    // TODO: probably we have to pass complete "manifest" anyways to implement e.g. client-initiated link prefetching.
    // TODO: this doesn't change on each render. so we could cache it?
    serverPageExports: mapValues(routesMeta, (v) => Object.keys(v.route)),
  };

  // collect asset paths for initial routes for assets preloading
  // (for production, it further needs to map via "dist/client/manifest.json")
  // (this matters only when users chose to use `globPageRoutesLazy` instead of `globPageRoutes`)
  const assetPaths = extraRouterInfo.matches
    .flatMap((m) =>
      routesMeta[m.route.id]?.entries.map((e) => !e.isServer && e.file)
    )
    .filter(typedBoolean);

  return {
    type: "render",
    context,
    router: createStaticRouter(handler.dataRoutes, context),
    statusCode: getResponseStatusCode(context),
    extraRouterInfo,
    extraRouterInfoScript: createGlobalScript(
      KEY_extraRouterInfo,
      extraRouterInfo
    ),
    assetPaths,
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

// general vite manifest utility to map production asset
// we don't do this inside the plugin since it's tricky to have a hard dependency on client manifest on server build
export function resolveManifestAssets(files: string[], manifest: Manifest) {
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
