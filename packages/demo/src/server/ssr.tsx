import { type RequestHandler } from "@hattip/compose";
import { generateThemeScript } from "@hiogawa/theme-script";
import { tinyassert } from "@hiogawa/utils";
import {
  type ServerRouterResult,
  globPageRoutesServer,
  handleReactRouterServer,
} from "@hiogawa/vite-glob-routes/dist/react-router/server";
import { viteDevServer } from "@hiogawa/vite-import-dev-server/runtime";
import React from "react";
import { renderToString } from "react-dom/server";
import { isRouteErrorResponse } from "react-router-dom";
import {
  StaticRouterProvider,
  createStaticRouter,
} from "react-router-dom/server";
import type { Manifest } from "vite";
import { logError } from "./log";

export function ssrHandler(): RequestHandler {
  const { routes, routesMeta } = globPageRoutesServer();
  const serverLoaderRouteIds = Object.entries(routesMeta)
    .filter(([_id, meta]) => meta.route.loader)
    .map(([id]) => id);

  return async (ctx) => {
    const manifest = await getClientManifest();
    const routerResult = await handleReactRouterServer({
      routes,
      routesMeta,
      manifest,
      request: ctx.request,
      onError: (e) => logError(e),
    });
    if (routerResult.type === "response") {
      return routerResult.response;
    }

    // we could move this logic to `handleReactRouterServer.onError`
    // https://github.com/remix-run/remix/blob/4e7f2bd55f75f489bc19316a671c9cd6e70bd930/packages/remix-server-runtime/server.ts#L275-L283
    for (const e of Object.values(routerResult.context.errors ?? {})) {
      if (!isRouteErrorResponse(e)) {
        logError(e);
      }
    }

    let ssrHtml: string;
    try {
      ssrHtml = render({ routerResult });
    } catch (e) {
      logError(e);

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

    let html = await importIndexHtml();
    html = html.replace("<!--@INJECT_SSR@-->", ssrHtml);

    html = html.replace(
      "<!--@INJECT_HEAD@-->",
      [
        routerResult.injectToHtml,
        generateThemeScript({
          storageKey: "vite-plugins-demo:theme",
          defaultTheme: "dark",
        }),
        // TODO: move this to utility?
        // prettier-ignore
        `<script>
          window.__viteManifest = ${JSON.stringify(manifest)};
          window.__serverLoaderRouteIds = ${JSON.stringify(serverLoaderRouteIds)};
          window.__initialMatchRouteIds = ${JSON.stringify(routerResult.context.matches.map(m => m.route.id))};
        </script>`,
      ].join("\n")
    );

    return new Response(html, {
      status: routerResult.context.statusCode,
      headers: [["content-type", "text/html"]],
    });
  };
}

async function importIndexHtml() {
  if (import.meta.env.DEV) {
    const html = (await import("/index.html?raw")).default;
    tinyassert(viteDevServer, "forgot 'importDevServerPlugin'?");
    return viteDevServer.transformIndexHtml("/", html);
  } else {
    return (await import("/dist/client/index.html?raw")).default;
  }
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
