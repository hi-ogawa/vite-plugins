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
// import { renderToReadableStream, renderToString } from "react-dom/server";
import { StaticRouterProvider } from "react-router-dom/server";
import type { Manifest } from "vite";
import {
  ReactQueryWrapper,
  __QUERY_CLIENT_STATE,
  createQueryClient,
  getQueryClientStateScript,
} from "../utils/react-query-utils";

export function createHattipApp() {
  return compose(loggerMiddleware(), globApiRoutes(), ssrHandler());
}

function ssrHandler(): RequestHandler {
  const { routes, routesMeta } = globPageRoutes();

  return async (ctx) => {
    // initialize request context for server loaders to prefetch queries
    const queryClient = createQueryClient();
    ctx.queryClient = queryClient;

    const routerResult = await handleReactRouterServer({
      routes,
      routesMeta,
      manifest: await getClientManifest(),
      request: ctx.request,
      requestContext: ctx,
    });
    if (routerResult.type === "response") {
      return routerResult.response;
    }

    const ssrHtml = await renderToStreamToString(
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
      [
        routerResult.injectToHtml,
        getThemeScript(),
        getQueryClientStateScript(queryClient),
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

// just for enabling `ErrorBoundary` during SSR
async function renderToStreamToString(
  reactEl: React.ReactElement
): Promise<string> {
  // workaround import error
  const { renderToReadableStream }: typeof import("react-dom/server") =
    await import("react-dom/server.browser" as string);

  const reactStream = await renderToReadableStream(reactEl, {
    onError(error, errorInfo) {
      console.error(error, errorInfo);
    },
  });
  await reactStream.allReady;

  let result = "";
  const stringStream = reactStream.pipeThrough(new TextDecoderStream());
  for await (const chunk of stringStream as any as AsyncIterable<string>) {
    result += chunk;
  }
  return result;
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
