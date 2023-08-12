import {
  type StaticHandlerContext,
  createStaticHandler,
} from "react-router-dom/server";
import type { Manifest } from "vite";
import { handleDateRequest } from "./features/data-request/server";
import {
  type ExtraRouterInfo,
  KEY_extraRouterInfo,
  type RouterStaticHandler,
  createGlobalScript,
  getPreloadLink,
  resolveAssetPathsByRouteId,
  serializeMatch,
  serializeRoutesMata,
} from "./misc";
import type { GlobPageRoutesResult } from "./route-utils";

export type ServerRouterResult =
  | {
      type: "render";
      handler: RouterStaticHandler;
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
  onError,
}: {
  routes: GlobPageRoutesResult["routes"];
  routesMeta: GlobPageRoutesResult["routesMeta"];
  manifest?: Manifest;
  request: Request;
  requestContext?: unknown; // provide app local context to server loader
  onError?: (e: unknown) => void; // for now only for data request loader exception since user code can process `context.errors` on its own.
}): Promise<ServerRouterResult> {
  const handler = createStaticHandler(routes);

  // handle direct server loader request (aka data request) https://github.com/remix-run/remix/blob/8268142371234795491070bafa23cd4607a36529/packages/remix-server-runtime/server.ts#L136-L139
  const dataRequestResponse = await handleDateRequest({
    handler,
    request,
    requestContext,
    onError,
  });
  if (dataRequestResponse) {
    return {
      type: "response",
      response: dataRequestResponse,
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
