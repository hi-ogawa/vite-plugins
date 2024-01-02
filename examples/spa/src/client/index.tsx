import { tinyassert } from "@hiogawa/utils";
import {
  globPageRoutesClient,
  setupPreload,
} from "@hiogawa/vite-glob-routes/dist/react-router/client";
import React from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";

async function main() {
  const el = document.getElementById("root");
  tinyassert(el);

  const { routes } = globPageRoutesClient();
  setupPreload({ routes });

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
