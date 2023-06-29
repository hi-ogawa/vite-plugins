import "virtual:uno.css";
import { tinyassert } from "@hiogawa/utils";
import { globPageRoutes } from "@hiogawa/vite-glob-routes/dist/react-router";
import React from "react";
import { hydrateRoot } from "react-dom/client";
import {
  type RouteObject,
  RouterProvider,
  createBrowserRouter,
} from "react-router-dom";
import {
  ReactQueryWrapper,
  createQueryClientWithState,
} from "../utils/react-query-utils";

async function main() {
  const el = document.getElementById("root");
  tinyassert(el);

  const routes = globPageRoutes();
  const routerResult = await initializeClientRouter({ routes });
  const queryClient = createQueryClientWithState();
  const root = (
    <React.StrictMode>
      <ReactQueryWrapper queryClient={queryClient}>
        {routerResult.element}
      </ReactQueryWrapper>
    </React.StrictMode>
  );
  hydrateRoot(el, root);
  el.dataset["testid"] = "hydrated"; // for e2e
}

// TODO: move helper to vite-glob-routes

// export async function initializeClientGlobPageRoutes() {
// }

async function initializeClientRouter({ routes }: { routes: RouteObject[] }) {
  const router = createBrowserRouter(routes);
  // need to wait to resolve lazy routes (i.e. dynamic import) to avoid hydration mismatch
  await routerInitializedPromise(router);
  return { element: <RouterProvider router={router} /> };
}

async function routerInitializedPromise(
  router: ReturnType<typeof createBrowserRouter>
) {
  if (router.state.initialized) {
    return;
  }
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
