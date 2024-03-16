import "virtual:uno.css";
import { tinyassert } from "@hiogawa/utils";
import {
  globPageRoutesClient,
  injectDataRequestLoaders,
  resolveLazyRoutes,
  setPreloadContext,
  setupGlobalPreloadHandler,
} from "@hiogawa/vite-glob-routes/dist/react-router/client";
import React from "react";
import { hydrateRoot } from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import type { Manifest } from "vite";

// cf. packages/demo/src/server/ssr.tsx
const serverHandoff = window as any as {
  __viteManifest?: Manifest;
  __serverLoaderRouteIds: string[];
  __initialMatchRouteIds: string[];
};

async function main() {
  const el = document.getElementById("root");
  tinyassert(el);

  const { routes, routesMeta } = globPageRoutesClient();
  await resolveLazyRoutes(routes, serverHandoff.__initialMatchRouteIds);
  injectDataRequestLoaders(routes, serverHandoff.__serverLoaderRouteIds);
  setPreloadContext({
    routes,
    routesMeta,
    manifest: serverHandoff.__viteManifest,
  });
  setupGlobalPreloadHandler();

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
