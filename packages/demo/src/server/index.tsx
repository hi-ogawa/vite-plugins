import { type RequestHandler, compose } from "@hattip/compose";
import { loggerMiddleware } from "@hiogawa/utils-experimental";
import THEME_SCRIPT from "@hiogawa/utils-experimental/dist/theme-script.global.js?raw";
import { globApiRoutes } from "@hiogawa/vite-glob-routes/dist/hattip";
import {
  globPageRoutes,
  handleReactRouterServer,
} from "@hiogawa/vite-glob-routes/dist/react-router";
import { importIndexHtml } from "@hiogawa/vite-import-index-html/dist/runtime";
import React from "react";
import { renderToString } from "react-dom/server";
import { StaticRouterProvider } from "react-router-dom/server";
import type { Manifest } from "vite";

export function createHattipApp() {
  return compose(loggerMiddleware(), globApiRoutes(), ssrHandler());
}

function ssrHandler(): RequestHandler {
  const { routes, routesMeta } = globPageRoutes();

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
      // TODO: streaming?
      ssrHtml = renderToString(
        <React.StrictMode>
          <StaticRouterProvider
            router={routerResult.router}
            context={routerResult.context}
          />
        </React.StrictMode>
      );
    } catch (e) {
      console.log(
        "== 2nd pass",
        e,
        routerResult.context._deepestRenderedBoundaryId
      );
      ssrHtml = renderToString(
        <React.StrictMode>
          <StaticRouterProvider
            router={routerResult.router}
            context={{
              ...routerResult.context,
              // cf. https://github.com/remix-run/react-router/blob/4e12473040de76abf26e1374c23a19d29d78efc0/packages/router/router.ts#L3021-L3034
              statusCode: 500,
              errors: {
                [routerResult.context._deepestRenderedBoundaryId ||
                routerResult.router.routes[0]!.id]: e,
              },
            }}
          />
        </React.StrictMode>
      );
    }

    let html = await importIndexHtml();
    html = html.replace("<!--@INJECT_SSR@-->", ssrHtml);

    // pass QueryClient state to client for hydration
    html = html.replace(
      "<!--@INJECT_HEAD@-->",
      [routerResult.injectToHtml, getThemeScript()].join("\n")
    );

    return new Response(html, {
      status: routerResult.statusCode,
      headers: [["content-type", "text/html"]],
    });
  };
}

async function getClientManifest(): Promise<Manifest | undefined> {
  if (import.meta.env.PROD) {
    // @ts-ignore
    const lib = await import("/dist/client/manifest.json");
    return lib.default;
  }
  return;
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
