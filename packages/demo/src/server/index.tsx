import { type RequestHandler, compose } from "@hattip/compose";
import { typedBoolean } from "@hiogawa/utils";
import THEME_SCRIPT from "@hiogawa/utils-experimental/dist/theme-script.global.js?raw";
import { globApiRoutes } from "@hiogawa/vite-glob-routes/dist/hattip";
import {
  globPageRoutes,
  handleReactRouterServer,
  resolveManifestAssets,
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
  const { routes, routesMeta } = globPageRoutes();

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

    // pass extra router information to client for legitimate SSR experience
    // TODO: move inside `handleReactRouterServer`?
    const serverRouterInfo: ServerRouterInfo = {
      // need to resolve lazy route before hydration on client
      matchRouteIds: routerResult.context.matches.map((v) => v.route.id),
      // for example, client can use this to auto inject `proxyServerLoader` (via `transformRoute`) for the page with server loader.
      // note that client cannot known this during "build" time since we build client before server.
      serverPageExports: Object.fromEntries(
        Object.entries(routesMeta).map(([id, meta]) => [
          id,
          meta.entries.flatMap((e) => (e.isServer ? Object.keys(e.mod) : [])) ??
            [],
        ])
      ),
    };

    const serverRouterInfoScript = `<script>window.__serverRouterInfo = ${JSON.stringify(
      serverRouterInfo
    )}</script>`;

    // collect assets for initial routes to preload (TODO: move to handleReactRouterServer?)
    let routeAssets = serverRouterInfo.matchRouteIds
      .flatMap((id) =>
        routesMeta[id]?.entries.map((e) => !e.isServer && e.file)
      )
      .filter(typedBoolean);

    // map to production asset path
    if (import.meta.env.PROD) {
      // @ts-ignore
      const { default: manifest } = await import("/dist/client/manifest.json");
      routeAssets = resolveManifestAssets(routeAssets, manifest);
    }

    let html = await importIndexHtml();
    html = html.replace("<!--@INJECT_SSR@-->", ssrHtml);

    // pass QueryClient state to client for hydration
    html = html.replace(
      "<!--@INJECT_HEAD@-->",
      [
        ...routeAssets.map((f) => getPreloadLink(f)),
        getThemeScript(),
        getQueryClientStateScript(queryClient),
        serverRouterInfoScript,
      ].join("\n")
    );

    // TODO: apply server loader headers?
    // remix employs `export const header = ...`
    // https://github.com/remix-run/remix/blob/8268142371234795491070bafa23cd4607a36529/packages/remix-server-runtime/headers.ts#L65-L76
    routerResult.context.loaderHeaders;

    return new Response(html, {
      status: routerResult.statusCode,
      headers: [["content-type", "text/html"]],
    });
  };
}

export type ServerRouterInfo = {
  matchRouteIds: string[];
  serverPageExports: Record<string, string[]>;
};

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
