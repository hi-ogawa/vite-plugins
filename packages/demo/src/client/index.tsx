import "virtual:uno.css";
import { tinyassert } from "@hiogawa/utils";
import {
  globPageRoutesClient,
  initializeClientRoutes,
  setPreloadContext,
} from "@hiogawa/vite-glob-routes/dist/react-router/client";
import React from "react";
import { hydrateRoot } from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import type { Manifest } from "vite";

// server hand-off data required for
// - resolve initial lazy route before mount
// - page preload
// (cf. packages/demo/src/server/ssr.tsx)
const { __viteManifest, __initialMatchRouteIds } = window as any as {
  __viteManifest?: Manifest;
  __initialMatchRouteIds: string[];
};

// TODO: use it for initializeClientRoutes
__initialMatchRouteIds;

async function main() {
  const el = document.getElementById("root");
  tinyassert(el);

  const { routes, routesMeta } = globPageRoutesClient();
  setPreloadContext({ routes, routesMeta, manifest: __viteManifest });

  await initializeClientRoutes({ routes });

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
