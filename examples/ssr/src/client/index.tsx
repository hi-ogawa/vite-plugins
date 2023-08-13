import { tinyassert } from "@hiogawa/utils";
import { injectDataRequestLoaders } from "@hiogawa/vite-glob-routes/dist/react-router/client";
import { globPageRoutesClientEager } from "@hiogawa/vite-glob-routes/dist/react-router/client-eager";
import React from "react";
import { hydrateRoot } from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";

const serverHandoff = window as any as {
  __serverLoaderRouteIds: string[];
};

async function main() {
  const el = document.getElementById("root");
  tinyassert(el);

  // use non-lazy routes in `examples/ssr` for simplicity and for testing
  // see `packages/demo` for lazy route with code-split page prefetching logic etc...
  const { routes } = globPageRoutesClientEager();
  injectDataRequestLoaders(routes, serverHandoff.__serverLoaderRouteIds);

  const router = createBrowserRouter(routes);
  const root = (
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  );
  React.startTransition(() => {
    hydrateRoot(el, root);
    el.classList.add("hydrated"); // e.g. for e2e
  });
}

main();
