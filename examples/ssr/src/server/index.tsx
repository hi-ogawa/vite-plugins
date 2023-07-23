import { type RequestHandler, compose } from "@hattip/compose";
import { tinyassert } from "@hiogawa/utils";
import { globApiRoutes } from "@hiogawa/vite-glob-routes/dist/hattip";
import {
  type ServerRouterResult,
  globPageRoutesServer,
  handleReactRouterServer,
} from "@hiogawa/vite-glob-routes/dist/react-router";
import { importIndexHtml } from "@hiogawa/vite-import-index-html/dist/runtime";
import React from "react";
import { renderToString } from "react-dom/server";
import {
  StaticRouterProvider,
  createStaticRouter,
} from "react-router-dom/server";
import type { Manifest } from "vite";

export function createHattipApp() {
  return compose(globApiRoutes(), ssrHandler());
}

function ssrHandler(): RequestHandler {
  const { routes, routesMeta } = globPageRoutesServer();

  return async (ctx) => {
    const routerResult = await handleReactRouterServer({
      routes,
      routesMeta,
      manifest: await getClientManifest(),
      request: ctx.request,
    });
    if (routerResult.type === "response") {
      return routerResult.response;
    }

    let ssrHtml: string;
    try {
      ssrHtml = render({ routerResult });
    } catch (e) {
      // two pass rendering to handle SSR error cf.
      // https://github.com/remix-run/remix/blob/9ae3cee0e81ccb7259d6103df490b019e8c2fd94/packages/remix-server-runtime/server.ts#L313-L361
      // https://github.com/remix-run/react-router/blob/4e12473040de76abf26e1374c23a19d29d78efc0/packages/router/router.ts#L3021-L3033
      const errorRouteId = routerResult.context._deepestRenderedBoundaryId;
      tinyassert(errorRouteId, "failed to resolve 'errorRouteId'");
      routerResult.context.errors = { [errorRouteId]: e };
      routerResult.context.statusCode = 500;
      ssrHtml = render({ routerResult });
    }

    let html = await importIndexHtml();
    html = html.replace("<!--@INJECT_SSR@-->", ssrHtml);

    html = html.replace("<!--@INJECT_HEAD@-->", routerResult.injectToHtml);

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
          routerResult.context
        )}
        context={routerResult.context}
      />
    </React.StrictMode>
  );
}

async function getClientManifest(): Promise<Manifest | undefined> {
  if (import.meta.env.PROD) {
    // @ts-ignore
    const lib = await import("/dist/client/manifest.json");
    return lib.default;
  }
  return;
}
