import { createDebug, memoize, tinyassert } from "@hiogawa/utils";
import type { RouterHistory } from "@tanstack/history";
import React from "react";
import ReactDOMClient from "react-dom/client";
import { initializeReactClientBrowser } from "../features/client-component/browser";
import { RootErrorBoundary } from "../features/error/error-boundary";
import {
  FlightDataContext,
  LayoutRoot,
  ROUTER_REVALIDATE_KEY,
  RouteAssetLinks,
  RouteManifestContext,
  routerRevalidate,
} from "../features/router/client";
import {
  Router,
  RouterContext,
  createEncodedBrowserHistory,
  useRouter,
} from "../features/router/client/router";
import {
  type RouteManifest,
  emptyRouteManifest,
} from "../features/router/manifest";
import type { FlightData } from "../features/router/utils";
import { parseFlightRedirectResponse } from "../features/server-action/redirect";
import { createStreamRequest } from "../features/server-component/utils";
import { $__global } from "../global";
import { createError } from "../server";
import type { CallServerCallback } from "../types/react";
import { getFlightStreamBrowser } from "../utils/stream-script";

const debug = createDebug("react-server:browser");

async function start() {
  initializeReactClientBrowser();

  const { default: ReactClient } = await import(
    "react-server-dom-webpack/client.browser"
  );

  const history = createEncodedBrowserHistory();
  const router = new Router(history);

  let $__setFlight: (v: Promise<FlightData>) => void;
  let $__startActionTransition: React.TransitionStartFunction;

  //
  // server action callback
  //
  const callServer: CallServerCallback = async (id, args) => {
    debug("callServer", { id, args });
    const { url, headers } = createStreamRequest(history.location.href, {
      lastPathname: history.location.pathname,
      actionId: id,
    });
    const request = new Request(url, {
      method: "POST",
      body: await ReactClient.encodeReply(args),
      headers,
    });
    return new Promise((resolve, reject) => {
      $__startActionTransition(async () => {
        (async () => {
          const response = await fetch(request);
          if (handleFlightRedirectResponse(history, response)) {
            return;
          }
          const result = ReactClient.createFromFetch<FlightData>(
            Promise.resolve(response),
            { callServer },
          );
          // TODO: similar to redirection, we could also skip flight stream
          // and return serialized error only.
          const actionResult = (await result).action;
          if (actionResult?.error) {
            throw createError(actionResult?.error);
          }
          $__setFlight(result);
          return actionResult?.data;
        })().then(resolve, reject);
      });
    });
  };

  // expose as global to be used for createServerReference
  $__global.callServer = callServer;

  // prepare initial layout data from inline <script>
  // TODO: needs to await for hydration formState. does it affect startup perf?
  const initialFlight = ReactClient.createFromReadableStream<FlightData>(
    getFlightStreamBrowser(),
    { callServer },
  );

  //
  // browser root
  //

  function FlightDataHandler(props: React.PropsWithChildren) {
    const [flight, setFlight] =
      React.useState<Promise<FlightData>>(initialFlight);

    // very shaky trick to merge with current layout
    $__setFlight = (nextPromise) => {
      setFlight(
        memoize(async (currentPromise: Promise<FlightData>) => {
          const current = await currentPromise;
          const next = await nextPromise;
          return {
            action: next.action,
            metadata: next.metadata,
            segments: next.segments,
            url: next.url,
            nodeMap: {
              ...current.nodeMap,
              ...next.nodeMap,
            },
            layoutContentMap: next.layoutContentMap,
          } satisfies FlightData;
        }),
      );
    };

    const [isPending, startTransition] = React.useTransition();
    const [isActionPending, startActionTransition] = React.useTransition();
    $__startActionTransition = startActionTransition;

    React.useEffect(() => router.setup(), []);
    React.useEffect(() => {
      document.firstElementChild?.setAttribute("data-test-state", "hydrated");
    }, []);

    React.useEffect(() => {
      debug("[isPending]", isPending);
      router.store.set((s) => ({ ...s, isPending }));
    }, [isPending]);

    React.useEffect(() => {
      debug("[isActionPending]", isActionPending);
      router.store.set((s) => ({ ...s, isActionPending }));
    }, [isActionPending]);

    const location = useRouter((s) => s.location);
    const lastLocation = React.useRef(location);

    React.useEffect(() => {
      if (location === lastLocation.current) {
        return;
      }
      const lastPathname = lastLocation.current.pathname;
      lastLocation.current = location;

      debug("[navigation]", location, {
        pathname: location.pathname,
        lastPathname,
      });
      const request = createStreamRequest(location.href, {
        lastPathname,
        revalidate: location.state[ROUTER_REVALIDATE_KEY],
      });
      startTransition(async () => {
        const response = await fetch(request);
        if (handleFlightRedirectResponse(history, response)) {
          return;
        }
        $__setFlight(
          ReactClient.createFromFetch<FlightData>(Promise.resolve(response), {
            callServer,
          }),
        );
      });
    }, [location]);

    return (
      <FlightDataContext.Provider value={flight}>
        {props.children}
      </FlightDataContext.Provider>
    );
  }

  const routeManifest = await importRouteManifest();
  let reactRootEl = (
    <RouterContext.Provider value={router}>
      <RootErrorBoundary>
        <FlightDataHandler>
          <RouteManifestContext.Provider value={routeManifest}>
            <RouteAssetLinks />
            <LayoutRoot />
          </RouteManifestContext.Provider>
        </FlightDataHandler>
      </RootErrorBoundary>
    </RouterContext.Provider>
  );
  if (!window.location.search.includes("__noStrict")) {
    reactRootEl = <React.StrictMode>{reactRootEl}</React.StrictMode>;
  }

  //
  // render
  //

  // full client render on SSR error
  if (document.documentElement.dataset["noHydrate"]) {
    ReactDOMClient.createRoot(document).render(reactRootEl);
  } else {
    const formState = (await initialFlight).action?.data;
    ReactDOMClient.hydrateRoot(document, reactRootEl, {
      formState,
    });
  }

  // custom event for RSC reload
  if (import.meta.hot) {
    import.meta.hot.on("rsc:update", (e) => {
      console.log("[react-server] hot update", e.file);
      history.replace(history.location.href, routerRevalidate("/"));
    });
  }
}

function handleFlightRedirectResponse(
  history: RouterHistory,
  response: Response,
) {
  const redirect = parseFlightRedirectResponse(response);
  if (redirect) {
    history.push(
      redirect.location,
      redirect.revalidate ? routerRevalidate(redirect.revalidate) : {},
    );
    return true;
  }
  return false;
}

async function importRouteManifest(): Promise<RouteManifest> {
  if (import.meta.env.DEV) {
    return emptyRouteManifest();
  } else {
    tinyassert((self as any).__routeManifestUrl);
    const mod = await import(
      /* @vite-ignore */ (self as any).__routeManifestUrl
    );
    return mod.default;
  }
}

declare module "react-dom/client" {
  interface HydrationOptions {
    formState?: unknown;
  }

  interface DO_NOT_USE_OR_YOU_WILL_BE_FIRED_EXPERIMENTAL_CREATE_ROOT_CONTAINERS {
    Document: Document;
  }
}

start();
