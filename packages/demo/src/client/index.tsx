import "virtual:uno.css";
import { tinyassert } from "@hiogawa/utils";
import {
  globPageRoutesClientLazy,
  initializeClientRoutes,
} from "@hiogawa/vite-glob-routes/dist/react-router";
import React from "react";
import { hydrateRoot } from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";

async function main() {
  const el = document.getElementById("root");
  tinyassert(el);

  const { routes } = globPageRoutesClientLazy();
  await initializeClientRoutes({ routes });

  const router = createBrowserRouter(routes);
  const root = (
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  );
  hydrateRoot(el, root);
  el.dataset["testid"] = "hydrated"; // for e2e
}

main();
