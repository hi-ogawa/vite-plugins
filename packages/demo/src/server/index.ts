import { type RequestHandler, compose } from "@hattip/compose";
import THEME_SCRIPT from "@hiogawa/utils-experimental/dist/theme-script.global.js?raw";
import { globApiRoutes } from "@hiogawa/vite-glob-routes/dist/hattip";
import { globPageRoutes } from "@hiogawa/vite-glob-routes/dist/react-router";
import { importIndexHtml } from "@hiogawa/vite-import-index-html/dist/runtime";
import type { Context, MiddlewareHandler } from "hono";
import { logger } from "hono/logger";
import {
  __QUERY_CLIENT_STATE,
  createQueryClient,
  getQueryClientStateScript,
} from "../utils/react-query-utils";
import { renderRoutes } from "./render-routes";

export function createHattipApp() {
  return compose(
    hattipHonoCompat(logger()),
    globApiRoutes(),
    globPageRoutesHandler()
  );
}

function globPageRoutesHandler(): RequestHandler {
  const routes = globPageRoutes();

  return async (ctx) => {
    // initialize queryClient in hattip/react-router context
    const queryClient = createQueryClient();
    ctx.locals.queryClient = queryClient;

    // SSR
    const res = await renderRoutes(ctx, routes, queryClient);
    if (res instanceof Response) {
      return res;
    }

    let html = await importIndexHtml();
    html = html.replace("<!--@INJECT_SSR@-->", res);

    // pass query client state to client
    html = html.replace(
      "<!--@INJECT_HEAD@-->",
      injectToHead() + getQueryClientStateScript(queryClient)
    );

    return new Response(html, {
      headers: [["content-type", "text/html"]],
    });
  };
}

function injectToHead() {
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
