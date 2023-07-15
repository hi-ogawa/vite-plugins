import { typedBoolean } from "@hiogawa/utils";
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
  getPreloadLink,
  resolveAssetPathsByRouteId,
  serializeMatch,
  serializeRoutesMata,
  unwrapLoaderRequest,
  wrapLoaderResult,
} from "./react-router-helper-shared";
import type { GlobPageRoutesResult } from "./react-router-utils";

// why is this not exposed?
type RemixRouter = ReturnType<typeof createStaticRouter>;

type ServerRouterResult =
  | {
      type: "render";
      context: StaticHandlerContext;
      router: RemixRouter;
      statusCode: number;
      injectToHtml: string;
    }
  | {
      type: "response";
      response: Response;
    };

export async function handleReactRouterServer({
  routes,
  routesMeta,
  manifest,
  request,
  requestContext,
}: {
  routes: GlobPageRoutesResult["routes"];
  routesMeta: GlobPageRoutesResult["routesMeta"];
  manifest?: Manifest;
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
    matches: context.matches.map((m) => serializeMatch(m)),
    routesMeta: serializeRoutesMata(routesMeta),
    manifest,
  };

  // collect asset paths of initial routes for assets preloading
  // (this matters only when users chose to use `globPageRoutesLazy` instead of `globPageRoutes` for per-page code-spliting)
  const assetPaths = extraRouterInfo.matches.flatMap((m) =>
    resolveAssetPathsByRouteId(m.route.id, extraRouterInfo)
  );

  return {
    type: "render",
    context,
    router: createStaticRouter(handler.dataRoutes, context),
    statusCode: getResponseStatusCode(context),
    injectToHtml: [
      assetPaths.map((f) => getPreloadLink(f)),
      createGlobalScript(KEY_extraRouterInfo, extraRouterInfo),
    ]
      .flat()
      .join("\n"),
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
