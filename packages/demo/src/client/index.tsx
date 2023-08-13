import "virtual:uno.css";
import { tinyassert } from "@hiogawa/utils";
import {
  globPageRoutesClient,
  injectDataRequestLoaders,
  resolveLazyRoutes,
  setPreloadContext,
} from "@hiogawa/vite-glob-routes/dist/react-router/client";
import React from "react";
import { hydrateRoot } from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import type { Manifest } from "vite";

// server hand-off data required for
// - setup client loader for data request
// - resolve initial lazy route before mount
// - page preload
// (cf. packages/demo/src/server/ssr.tsx)
const { __viteManifest, __serverLoaderRouteIds, __initialMatchRouteIds } =
  window as any as {
    // only __initialMatchRouteIds depends on request,
    // so other data could be hard-coded somewhere after build?
    __viteManifest?: Manifest;
    __serverLoaderRouteIds: string[];
    __initialMatchRouteIds: string[];
  };

async function main() {
  const el = document.getElementById("root");
  tinyassert(el);

  const { routes, routesMeta } = globPageRoutesClient();
  await resolveLazyRoutes(routes, __initialMatchRouteIds);
  injectDataRequestLoaders(routes, __serverLoaderRouteIds);
  setPreloadContext({ routes, routesMeta, manifest: __viteManifest });

  const router = createBrowserRouter(routes);
  const root = (
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  );
  React.startTransition(() => {
    hydrateRoot(el, root);
    el.classList.add("hydrated"); // for spinner and e2e
  });
}

main();
