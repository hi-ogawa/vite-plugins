import "virtual:uno.css";
import { tinyassert } from "@hiogawa/utils";
import { globPageRoutes } from "@hiogawa/vite-glob-routes/dist/react-router";
import React from "react";
import { hydrateRoot } from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import {
  ReactQueryWrapper,
  createQueryClientWithState,
} from "../utils/react-query-utils";

async function main() {
  const el = document.getElementById("root");
  tinyassert(el);

  // need to wait for fetching initial lazy route before hydration to match SSR
  // https://github.com/remix-run/react-router/blob/bc2552840147206716544e5cdcdb54f649f9193f/packages/router/router.ts#L757-L762
  const router = createBrowserRouter(globPageRoutes());
  tinyassert(!router.state.initialized);
  await waitForRouterInitialized(router);
  tinyassert(router.state.initialized);

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

async function waitForRouterInitialized(
  router: ReturnType<typeof createBrowserRouter>
) {
  await new Promise<void>((resolve) => {
    const unsubscribe = router.subscribe((state) => {
      if (state.initialized) {
        resolve();
        unsubscribe();
      }
    });
  });
}

main();
