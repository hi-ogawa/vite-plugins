import { type RouteObject } from "react-router";
import { createBrowserRouter } from "react-router-dom";

// why is this not exposed?
type RemixRouter = ReturnType<typeof createBrowserRouter>;

type ClientRouterResult = {
  router: RemixRouter;
};

export async function initializeReactRouterClient({
  routes,
}: {
  routes: RouteObject[];
}): Promise<ClientRouterResult> {
  const router = createBrowserRouter(routes);
  // need to wait to resolve lazy routes (i.e. dynamic import) to avoid hydration mismatch
  await routerInitializedPromise(router);
  return { router };
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
