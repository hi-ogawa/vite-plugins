import { type RequestHandler, compose } from "@hattip/compose";
import THEME_SCRIPT from "@hiogawa/utils-experimental/dist/theme-script.global.js?raw";
import { globApiRoutes } from "@hiogawa/vite-glob-routes/dist/hattip";
import {
  getCurrentRouteAssets,
  globPageRoutes,
  handleReactRouterServer,
} from "@hiogawa/vite-glob-routes/dist/react-router";
import { importIndexHtml } from "@hiogawa/vite-import-index-html/dist/runtime";
import type { Context, MiddlewareHandler } from "hono";
import { logger } from "hono/logger";
import React from "react";
import { renderToString } from "react-dom/server";
import { StaticRouterProvider } from "react-router-dom/server";
import {
  ReactQueryWrapper,
  __QUERY_CLIENT_STATE,
  createQueryClient,
  getQueryClientStateScript,
} from "../utils/react-query-utils";

export function createHattipApp() {
  return compose(hattipHonoCompat(logger()), globApiRoutes(), ssrHandler());
}

function ssrHandler(): RequestHandler {
  const { routes } = globPageRoutes();

  return async (ctx) => {
    // initialize request context for server loaders to prefetch queries
    const queryClient = createQueryClient();
    ctx.queryClient = queryClient;

    const routerResult = await handleReactRouterServer({
      routes,
      request: ctx.request,
      requestContext: ctx,
    });
    if (routerResult.type === "response") {
      return routerResult.response;
    }

    // TODO: streaming?
    const ssrHtml = renderToString(
      <React.StrictMode>
        <ReactQueryWrapper queryClient={queryClient}>
          <StaticRouterProvider
            router={routerResult.router}
            context={routerResult.context}
          />
        </ReactQueryWrapper>
      </React.StrictMode>
    );

    // collect preload link
    const routeAssets = getCurrentRouteAssets({
      routes,
      context: routerResult.context,
      manifest: import.meta.env.PROD
        ? // @ts-ignore
          (await import("/dist/client/manifest.json")).default
        : undefined,
    });

    let html = await importIndexHtml();
    html = html.replace("<!--@INJECT_SSR@-->", ssrHtml);

    // pass QueryClient state to client for hydration
    html = html.replace(
      "<!--@INJECT_HEAD@-->",
      [
        ...routeAssets.map((f) => getPreloadLink(f)),
        getThemeScript(),
        getQueryClientStateScript(queryClient),
      ].join("\n")
    );

    return new Response(html, {
      status: routerResult.statusCode,
      headers: [["content-type", "text/html"]],
    });
  };
}

function getPreloadLink(href: string) {
  return `<link rel="modulepreload" href="${href}" />`;
}

function getThemeScript() {
  return `
    <script>
      globalThis.__themeStorageKey = "vite-plugins:theme";
      globalThis.__themeDefault = "dark";
      ${THEME_SCRIPT}
    </script>
  `;
}

// minimal compatibility to use hono's logger in hattip
// https://github.com/honojs/hono/blob/0ffd795ec6cfb67d38ab902197bb5461a4740b8f/src/middleware/logger/index.ts
function hattipHonoCompat(hono: MiddlewareHandler): RequestHandler {
  return async (ctx) => {
    let res!: Response;
    await hono(
      {
        req: { method: ctx.method, raw: ctx.request },
        get res() {
          return res;
        },
      } as Context,
      async () => {
        res = await ctx.next();
      }
    );
    return res;
  };
}
