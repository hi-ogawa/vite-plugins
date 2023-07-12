import { type LoaderFunction, type RouteObject } from "react-router";
import { createBrowserRouter } from "react-router-dom";
import {
  LOADER_REQUEST_HEADER,
  unwrapLoaderResult,
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

// client loader to proxy server loaders (aka data request)
export const proxyServerLoader: LoaderFunction = async (args) => {
  const res = await fetch(args.request.url, {
    headers: {
      [LOADER_REQUEST_HEADER]: "1",
    },
  });
  return unwrapLoaderResult(res);
};
