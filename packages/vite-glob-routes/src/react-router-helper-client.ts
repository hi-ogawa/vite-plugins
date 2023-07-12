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
  // TODO: this might be unsupported usage in general? https://github.com/remix-run/react-router/blob/9c1892ac4d222135a0d1a5033aad4f1fcfab11df/packages/router/router.ts#L942-L949
  //       > For SSR it's expected that lazy modules are
  //       > resolved prior to router creation since we can't go into a fallbackElement
  //       > UI for SSR'd apps
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
