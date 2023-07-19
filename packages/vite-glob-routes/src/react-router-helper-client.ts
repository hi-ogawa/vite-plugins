import { tinyassert, typedBoolean } from "@hiogawa/utils";
import {
  type DataRouteObject,
  type LazyRouteFunction,
  type LoaderFunction,
  matchRoutes,
} from "react-router";
import {
  type ExtraRouterInfo,
  KEY_extraRouterInfo,
  getGlobalScriptData,
  resolveAssetPathsByRouteId,
  unwrapLoaderResult,
  wrapLoaderRequest,
} from "./react-router-helper-shared";
import { walkArrayTree } from "./react-router-utils";

export async function initializeClientRoutes({
  routes,
  noAutoProxyServerLoader,
}: {
  routes: DataRouteObject[]; // mutated
  noAutoProxyServerLoader?: boolean;
}) {
  // setup client global
  const extraRouterInfo = getGlobalScriptData(
    KEY_extraRouterInfo
  ) as ExtraRouterInfo;
  tinyassert(extraRouterInfo, "forgot 'extraRouterInfo'?");

  setClientGlobal({
    client: { routes },
    server: {
      extraRouterInfo,
    },
  });

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
    extraRouterInfo.matches
      .map((m) => routeIdMap.get(m.route.id))
      .filter(typedBoolean)
      .map((route) => resolveLazyRouteObject(route))
  );

  // auto setup `proxyServerLoader` for the pages with server loader but without client loader as extra convenient convention
  if (!noAutoProxyServerLoader) {
    for (const [id, route] of routeIdMap) {
      const meta = extraRouterInfo.routesMeta[id];
      if (meta?.exports.includes("loader")) {
        mutateRouteObject(route, (resolved) => {
          if (!resolved.loader) {
            resolved.loader = createProxyServerLoader(route.id);
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
// client global
//

// hopefully this is the only nasty global thing we have to do...
export interface ClientGlobal {
  client: {
    routes: DataRouteObject[];
  };
  // runtime data passed by server
  server: {
    extraRouterInfo: ExtraRouterInfo;
  };
}

let __clientGlobal: ClientGlobal;

function setClientGlobal(v: ClientGlobal) {
  __clientGlobal = v;
}

export function getClientGlobal() {
  tinyassert(__clientGlobal, "forgot 'clientGlobal'?");
  return __clientGlobal;
}

//
// prefetching
//

// TOOD: css? loader data?
// TODO: rename resolvePageDependencies?
// cf. https://github.com/remix-run/remix/blob/9ae3cee0e81ccb7259d6103df490b019e8c2fd94/packages/remix-react/components.tsx#L479
export function getPagePrefetchLinks(page: string) {
  const { client, server } = getClientGlobal();
  const matches = matchRoutes(client.routes, page) ?? [];
  const modules = matches.flatMap((m) =>
    resolveAssetPathsByRouteId(m.route.id, server.extraRouterInfo)
  );
  return { modules };
}

//
// client loader
//

// client loader to proxy server loaders (aka data request)
function createProxyServerLoader(routeId: string): LoaderFunction {
  return async (args) => {
    const req = wrapLoaderRequest(args.request, routeId);
    const res = await fetch(req);
    return unwrapLoaderResult(res);
  };
}
