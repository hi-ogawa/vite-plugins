import type { DataRouteObject, LazyRouteFunction } from "react-router";
import { walkArrayTree } from "../../route-utils";

//
// Need to resolve "lazy" route for initial matching routes. otherwise it will leads to hydration mismatch and redundant initial client loader call.
// See https://github.com/remix-run/react-router/blob/9c1892ac4d222135a0d1a5033aad4f1fcfab11df/packages/router/router.ts#L942-L949
// > For SSR it's expected that lazy modules are
// > resolved prior to router creation since we can't go into a fallbackElement
// > UI for SSR'd apps
//
// To achieve that, we need to rely on server to provide current url's matching route id based on `StaticHandler.query`.
// This feature is not directly provided by react-router yet.
// Note that doing `matchRoutes` on client has a slightly different behavior regarding error/not-found compared to server's `StaticHandler.query`.
//
export async function resolveLazyRoutes(
  routes: DataRouteObject[], // mutated
  selectedRouteIds: string[],
) {
  const ids = new Set(selectedRouteIds);
  const toResolve: DataRouteObject[] = [];
  walkArrayTree(routes, (route) => {
    if (ids.has(route.id)) {
      toResolve.push(route);
    }
  });
  for (const route of toResolve) {
    await resolveLazyRouteObject(route);
  }
}

async function resolveLazyRouteObject(
  route: DataRouteObject, // mutated
) {
  if (route.lazy) {
    Object.assign(route, await route.lazy(), { lazy: undefined });
  }
}

type ResolvedRouteObject = Awaited<
  ReturnType<LazyRouteFunction<DataRouteObject>>
>;

// manipulate route properties while keeping lazy-ness
export function mutateRouteObject(
  r1: DataRouteObject,
  mutateFn: (resolved: DataRouteObject | ResolvedRouteObject) => void,
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
