import { type RequestHandler, compose } from "@hattip/compose";
import THEME_SCRIPT from "@hiogawa/utils-experimental/dist/theme-script.global.js?raw";
import { globApiRoutes } from "@hiogawa/vite-glob-routes/dist/hattip";
import {
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
import {
  type ServerContext,
  getServerContext,
  serverContextStorage,
} from "./server-context";

export function createHattipApp() {
  return compose(
    serverContextProvider(),
    hattipHonoCompat(logger()),
    globApiRoutes(),
    ssrHandler()
  );
}

function serverContextProvider(): RequestHandler {
  return async (ctx) => {
    const serverContext: ServerContext = {
      queryClient: createQueryClient(),
      requestContext: ctx,
    };
    return serverContextStorage.run(serverContext, () => ctx.next());
  };
}

function ssrHandler(): RequestHandler {
  const routes = globPageRoutes();

  return async (ctx) => {
    const routerResult = await handleReactRouterServer({
      routes,
      request: ctx.request,
    });
    if (routerResult.type === "response") {
      return routerResult.response;
    }

    // TODO: streaming?
    const { queryClient } = getServerContext();
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

    let html = await importIndexHtml();
    html = html.replace("<!--@INJECT_SSR@-->", ssrHtml);

    // pass QueryClient state to client for hydration
    html = html.replace(
      "<!--@INJECT_HEAD@-->",
      getThemeScript() + getQueryClientStateScript(queryClient)
    );

    return new Response(html, {
      status: routerResult.statusCode,
      headers: [["content-type", "text/html"]],
    });
  };
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
