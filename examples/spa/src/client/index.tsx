import { tinyassert } from "@hiogawa/utils";
import { globPageRoutesClient } from "@hiogawa/vite-glob-routes/dist/react-router/client";
import React from "react";
import { hydrateRoot } from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";

async function main() {
  const el = document.getElementById("root");
  tinyassert(el);

  const { routes } = globPageRoutesClient();
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
