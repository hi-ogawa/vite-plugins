import {
  type LoaderFunction,
  type RouteObject,
  matchRoutes,
} from "react-router";
import { createBrowserRouter } from "react-router-dom";
import {
  unwrapLoaderResult,
  wrapLoaderRequest,
} from "./react-router-helper-shared";

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
  // Resolve lazy route for current route. otherwise it will leads to hydration mismatch and redundant initial client loader call.
  // See https://github.com/remix-run/react-router/blob/9c1892ac4d222135a0d1a5033aad4f1fcfab11df/packages/router/router.ts#L942-L949
  // > For SSR it's expected that lazy modules are
  // > resolved prior to router creation since we can't go into a fallbackElement
  // > UI for SSR'd apps

  // TODO: for "Not found" error, there's no match but it has to load relevant `ErrorBoundary` to avoid hydration mismatch...
  //       `StaticHandlerContext.matches` will include such routes, so probably server should pass that to client
  //       since, in general, it already feels weird to do `matchRoutes` for both server and client.
  const matchedRoutes = matchRoutes(routes, window.location);
  if (matchedRoutes) {
    // mutating RouteObject directly works for now...
    for (const { route } of matchedRoutes) {
      if (route.lazy) {
        const resolved = await route.lazy();
        delete route.lazy;
        Object.assign(route, resolved);
      }
    }
  }

  // after resolving lazy routes above, router should be able to initialize synchronously.
  // otherwise, there is probably something wrong in either server or client setup.
  // https://github.com/remix-run/react-router/blob/9c1892ac4d222135a0d1a5033aad4f1fcfab11df/packages/router/router.ts#L791-L796
  const router = createBrowserRouter(routes);
  if (!router.state.initialized) {
    console.warn("[vite-glob-routes] client router is in unexpected state");
    await routerInitializedPromise(router);
  }
  return { router };
}

async function routerInitializedPromise(
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

// client loader to proxy server loaders (aka data request)
export const proxyServerLoader: LoaderFunction = async (args) => {
  const req = wrapLoaderRequest(args.request);
  const res = await fetch(req);
  return unwrapLoaderResult(res);
};
