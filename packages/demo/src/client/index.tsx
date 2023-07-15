import "virtual:uno.css";
import { tinyassert } from "@hiogawa/utils";
import {
  globPageRoutesLazy,
  proxyServerLoader,
  walkArrayTreeAsync,
} from "@hiogawa/vite-glob-routes/dist/react-router";
import React from "react";
import { hydrateRoot } from "react-dom/client";
import {
  type DataRouteObject,
  RouterProvider,
  createBrowserRouter,
} from "react-router-dom";
import type { ServerRouterInfo } from "../server";
import {
  ReactQueryWrapper,
  createQueryClientWithState,
} from "../utils/react-query-utils";

async function main() {
  const el = document.getElementById("root");
  tinyassert(el);

  const { routes } = globPageRoutesLazy();

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

  await walkArrayTreeAsync(routes as DataRouteObject[], async (route) => {
    // implement the convention of auto injecting `proxyServerLoader` for the pages with server loader
    const serverExports = serverRouterInfo.serverPageExports[route.id];
    if (serverExports?.includes("loader")) {
      // currently apply such convention only for "/loader-data"
      if (route.path?.includes("loader-data")) {
        mergeRouteObject(route, { loader: proxyServerLoader });
      }
    }

    // resolve lazy of initial routes (TODO: Promise.all?)
    if (serverRouterInfo.matchRouteIds.includes(route.id)) {
      await resolveLazyRouteObject(route);
    }
  });

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

// TODO: to utils

// merge route properties while keeping lazy-ness
function mergeRouteObject(
  r1: DataRouteObject, // mutated
  r2: Partial<DataRouteObject> // assume non-lazy
) {
  tinyassert(!r2.lazy);
  const oldLazy = r1.lazy;
  if (oldLazy) {
    r1.lazy = async () => {
      const resolved = await oldLazy();
      return { ...resolved, ...r2 };
    };
  } else {
    Object.assign(r1, r2);
  }
}

async function resolveLazyRouteObject(
  route: DataRouteObject // mutated
) {
  if (route.lazy) {
    Object.assign(route, await route.lazy(), { lazy: undefined });
  }
}

main();
