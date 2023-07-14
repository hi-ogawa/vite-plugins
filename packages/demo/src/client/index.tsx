import "virtual:uno.css";
import { tinyassert } from "@hiogawa/utils";
import {
  globPageRoutesLazy,
  proxyServerLoader,
} from "@hiogawa/vite-glob-routes/dist/react-router";
import React from "react";
import { hydrateRoot } from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import type { ServerRouterInfo } from "../server";
import {
  ReactQueryWrapper,
  createQueryClientWithState,
} from "../utils/react-query-utils";

async function main() {
  const el = document.getElementById("root");
  tinyassert(el);

  const { routes, manifest } = globPageRoutesLazy();

  //
  // Resolve "lazy" route for current matching routes. otherwise it will leads to hydration mismatch and redundant initial client loader call.
  // See https://github.com/remix-run/react-router/blob/9c1892ac4d222135a0d1a5033aad4f1fcfab11df/packages/router/router.ts#L942-L949
  // > For SSR it's expected that lazy modules are
  // > resolved prior to router creation since we can't go into a fallbackElement
  // > UI for SSR'd apps
  //
  // To achieve that, we need to rely on server to provide current url's matching route id based on `StaticHandler.query`.
  // We could say that's react-router limitation but it's reasonable since .
  // Note that doing `matchRoutes` on client seems to have a slightly different behavior regarding error/not-found compared to server's `StaticHandler.query`.
  //
  const serverRouterInfo: ServerRouterInfo = (window as any).__serverRouterInfo;

  // for example, we could also implement the convention of auto injecting `proxyServerLoader` for the pages with server loader
  for (const [id, serverExports] of Object.entries(
    serverRouterInfo.serverPageExports
  )) {
    if (serverExports.includes("loader")) {
      const route = manifest[id];
      tinyassert(route);
      tinyassert(route.lazy);
      // currently such convention should be applied only for "/loader-data"
      if (!route.path?.includes("loader-data")) {
        continue;
      }
      const oldLazy = route.lazy;
      route.lazy = async () => {
        const resolved = await oldLazy();
        tinyassert(!resolved.loader);
        resolved.loader = proxyServerLoader;
        return resolved;
      };
    }
  }

  for (const id of serverRouterInfo.matchRouteIds) {
    // mutating RouteObject in `manifest` will affect `routes`
    const route = manifest[id];
    tinyassert(route);
    tinyassert(route.lazy);
    const resolved = await route.lazy();
    delete route.lazy;
    Object.assign(route, resolved);
  }

  const router = createBrowserRouter(routes);
  const queryClient = createQueryClientWithState();
  const root = (
    <React.StrictMode>
      <ReactQueryWrapper queryClient={queryClient}>
        <RouterProvider router={router} />
      </ReactQueryWrapper>
    </React.StrictMode>
  );
  hydrateRoot(el, root);
  el.dataset["testid"] = "hydrated"; // for e2e
}

main();
