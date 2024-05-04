import { type RequestHandler } from "@hattip/compose";
import { tinyassert } from "@hiogawa/utils";
import {
  type ServerRouterResult,
  globPageRoutesServer,
  handleReactRouterServer,
} from "@hiogawa/vite-glob-routes/dist/react-router/server";
import React from "react";
import { renderToString } from "react-dom/server";
import {
  StaticRouterProvider,
  createStaticRouter,
} from "react-router-dom/server";

export function ssrHandler(): RequestHandler {
  const { routes, routesMeta } = globPageRoutesServer();
  const serverLoaderRouteIds = Object.entries(routesMeta)
    .filter(([_id, meta]) => meta.route.loader)
    .map(([id]) => id);

  return async (ctx) => {
    const routerResult = await handleReactRouterServer({
      routes,
      request: ctx.request,
    });
    if (routerResult.type === "response") {
      return routerResult.response;
    }

    let ssrHtml: string;
    try {
      ssrHtml = render({ routerResult });
    } catch (e) {
      console.error(e);

      // two pass rendering to handle SSR error cf.
      // https://github.com/remix-run/remix/blob/9ae3cee0e81ccb7259d6103df490b019e8c2fd94/packages/remix-server-runtime/server.ts#L313-L361
      // https://github.com/remix-run/react-router/blob/4e12473040de76abf26e1374c23a19d29d78efc0/packages/router/router.ts#L3021-L3033
      const errorRouteId =
        routerResult.context._deepestRenderedBoundaryId ??
        routerResult.handler.dataRoutes[0]?.id;
      tinyassert(errorRouteId, "failed to resolve 'errorRouteId'");
      routerResult.context.errors = { [errorRouteId]: e };
      routerResult.context.statusCode = 500;
      ssrHtml = render({ routerResult });
    }

    // load tempalte
    let html: string;
    if (import.meta.env.DEV) {
      html = (await import("/index.html?raw")).default;
      html = await (ctx.platform as any).env.__RPC.transformIndexHtml(
        "/",
        html,
      );
    } else {
      html = (await import("/dist/client/index.html?raw")).default;
    }

    html = html.replace("<!--@INJECT_SSR@-->", () => ssrHtml);
    html = html.replace(
      "<!--@INJECT_HEAD@-->",
      () =>
        `<script>window.__serverLoaderRouteIds = ${JSON.stringify(
          serverLoaderRouteIds,
        )}</script>`,
    );

    return new Response(html, {
      status: routerResult.context.statusCode,
      headers: [["content-type", "text/html"]],
    });
  };
}

function render({
  routerResult,
}: {
  routerResult: ServerRouterResult & { type: "render" };
}) {
  // TODO: streaming?
  return renderToString(
    <React.StrictMode>
      <StaticRouterProvider
        router={createStaticRouter(
          routerResult.handler.dataRoutes,
          routerResult.context,
        )}
        context={routerResult.context}
      />
    </React.StrictMode>,
  );
}
