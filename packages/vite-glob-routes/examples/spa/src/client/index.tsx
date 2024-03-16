import { tinyassert } from "@hiogawa/utils";
import {
  globPageRoutesClient,
  setPreloadContext,
  setupGlobalPreloadHandler,
} from "@hiogawa/vite-glob-routes/dist/react-router/client";
import React from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import type { Manifest } from "vite";

// see examples/spa/misc/inject-global-script.js
const __viteManifest: Manifest | undefined = (window as any).__viteManifest;

async function main() {
  const el = document.getElementById("root");
  tinyassert(el);

  const { routes, routesMeta } = globPageRoutesClient();
  setPreloadContext({ routes, routesMeta, manifest: __viteManifest });
  setupGlobalPreloadHandler();

  const router = createBrowserRouter(routes);
  const root = (
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  );
  const reactRoot = createRoot(el);
  reactRoot.render(root);
}

main();
