import { wrapErrorAsync } from "@hiogawa/utils";
import {
  type StaticHandlerContext,
  createStaticHandler,
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
} from "./misc";
import type { GlobPageRoutesResult } from "./route-utils";

// typings from "@remix-run/router"
// for now just derive it from "react-router" exports
type RemixStaticHandler = ReturnType<typeof createStaticHandler>;

export type ServerRouterResult =
  | {
      type: "render";
      handler: RemixStaticHandler;
      context: StaticHandlerContext;
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
    const loaderResult = await wrapErrorAsync(() =>
      handler.queryRoute(loaderRequest.request, {
        routeId: loaderRequest.routeId,
        requestContext,
      })
    );
    return {
      type: "response",
      response: wrapLoaderResult(loaderResult),
    };
  }

  // handle react-router SSR request
  // TODO: how to intercept react-router error handling/rendering to `ssrFixStacktrace`?
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
    handler,
    context,
    injectToHtml: [
      assetPaths.map((f) => getPreloadLink(f)),
      // TOOD: support nonce for CSP? https://github.com/remix-run/react-router/blob/4e12473040de76abf26e1374c23a19d29d78efc0/packages/react-router-dom/server.tsx#L148
      createGlobalScript(KEY_extraRouterInfo, extraRouterInfo),
    ]
      .flat()
      .join("\n"),
  };
}
