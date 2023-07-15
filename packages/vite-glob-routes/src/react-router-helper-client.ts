import { tinyassert, typedBoolean } from "@hiogawa/utils";
import {
  type DataRouteObject,
  type LazyRouteFunction,
  type LoaderFunction,
  type RouteObject,
  matchRoutes,
} from "react-router";
import { createBrowserRouter } from "react-router-dom";
import {
  type ExtraRouterInfo,
  KEY_extraRouterInfo,
  getGlobalScriptData,
  unwrapLoaderResult,
  wrapLoaderRequest,
} from "./react-router-helper-shared";
import { walkArrayTree } from "./react-router-utils";

// why is this not exposed?
type RemixRouter = ReturnType<typeof createBrowserRouter>;

type ClientRouterResult = {
  router: RemixRouter;
};

// TODO: remove unused
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

async function routerInitializedPromise(router: RemixRouter) {
  await new Promise<void>((resolve) => {
    const unsubscribe = router.subscribe((state) => {
      if (state.initialized) {
        resolve();
        unsubscribe();
      }
    });
  });
}

export async function initializeClientRoutes({
  routes,
  extraRouterInfo,
  noAutoProxyServerLoader,
}: {
  routes: DataRouteObject[];
  extraRouterInfo?: ExtraRouterInfo; // user can pass directly without relying on global script
  noAutoProxyServerLoader?: boolean;
}) {
  if (!extraRouterInfo) {
    extraRouterInfo = getGlobalScriptData(KEY_extraRouterInfo) as any;
    tinyassert(extraRouterInfo);
  }

  //
  // Resolve "lazy" route for current matching routes. otherwise it will leads to hydration mismatch and redundant initial client loader call.
  // See https://github.com/remix-run/react-router/blob/9c1892ac4d222135a0d1a5033aad4f1fcfab11df/packages/router/router.ts#L942-L949
  // > For SSR it's expected that lazy modules are
  // > resolved prior to router creation since we can't go into a fallbackElement
  // > UI for SSR'd apps
  //
  // To achieve that, we need to rely on server to provide current url's matching route id based on `StaticHandler.query`.
  // This feature is not directly provided by react-router yet.
  // Note that doing `matchRoutes` on client has a slightly different behavior regarding error/not-found compared to server's `StaticHandler.query`.
  //

  // make flat structure by walking tree
  const routeIdMap = new Map<string, DataRouteObject>();
  walkArrayTree(routes, (route) => {
    routeIdMap.set(route.id, route);
  });

  // resolve lazy
  await Promise.all(
    extraRouterInfo.matchRouteIds
      .map((id) => routeIdMap.get(id))
      .filter(typedBoolean)
      .map((route) => resolveLazyRouteObject(route))
  );

  // auto setup `proxyServerLoader` for the pages with server loader but without client loader as extra convenient convention
  if (!noAutoProxyServerLoader) {
    for (const [id, route] of routeIdMap) {
      const server = extraRouterInfo.serverPageExports[id];
      if (server?.includes("loader")) {
        mutateRouteObject(route, (route) => {
          if (!route.loader) {
            route.loader = proxyServerLoader;
          }
        });
      }
    }
  }
}

async function resolveLazyRouteObject(
  route: DataRouteObject // mutated
) {
  if (route.lazy) {
    Object.assign(route, await route.lazy(), { lazy: undefined });
  }
}

type ResolvedRouteObject = Awaited<
  ReturnType<LazyRouteFunction<DataRouteObject>>
>;

// manipulate route properties while keeping lazy-ness
function mutateRouteObject(
  r1: DataRouteObject,
  mutateFn: (resolved: ResolvedRouteObject) => void
) {
  const oldLazy = r1.lazy;
  if (oldLazy) {
    r1.lazy = async () => {
      const resolved = await oldLazy();
      mutateFn(resolved);
      return resolved;
    };
  } else {
    mutateFn(r1);
  }
}

//
// client loader
//

// client loader to proxy server loaders (aka data request)
export const proxyServerLoader: LoaderFunction = async (args) => {
  const req = wrapLoaderRequest(args.request);
  const res = await fetch(req);
  return unwrapLoaderResult(res);
};
