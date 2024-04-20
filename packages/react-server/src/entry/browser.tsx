import { createDebug, memoize } from "@hiogawa/utils";
import React from "react";
import reactDomClient from "react-dom/client";
import {
  LayoutRoot,
  LayoutStateContext,
  ROUTER_REVALIDATE_KEY,
  routerRevalidate,
} from "../features/router/client";
import type { ServerRouterData } from "../features/router/utils";
import { wrapStreamActionRequest } from "../features/server-action/utils";
import { wrapStreamRequestUrl } from "../features/server-component/utils";
import { initializeWebpackBrowser } from "../features/use-client/browser";
import { RootErrorBoundary } from "../lib/client/error-boundary";
import {
  Router,
  RouterContext,
  createEncodedBrowserHistory,
  useRouter,
} from "../lib/client/router";
import { $__global } from "../lib/global";
import type { CallServerCallback } from "../lib/types";
import { readStreamScript } from "../utils/stream-script";

const debug = createDebug("react-server:browser");

export async function start() {
  initializeWebpackBrowser();

  const { default: reactServerDomClient } = await import(
    "react-server-dom-webpack/client.browser"
  );

  const history = createEncodedBrowserHistory();
  const router = new Router(history);

  let $__setLayout: (v: Promise<ServerRouterData>) => void;
  let $__startActionTransition: React.TransitionStartFunction;

  //
  // server action callback
  //
  const callServer: CallServerCallback = async (id, args) => {
    debug("callServer", { id, args });
    const request = new Request(
      wrapStreamRequestUrl(history.location.href, {
        lastPathname: history.location.pathname,
      }),
      {
        method: "POST",
        body: await reactServerDomClient.encodeReply(args),
        headers: wrapStreamActionRequest(id),
      },
    );
    const result = reactServerDomClient.createFromFetch<ServerRouterData>(
      fetch(request),
      { callServer },
    );
    $__startActionTransition(() => $__setLayout(result));
    return (await result).action?.data;
  };

  // expose as global to be used for createServerReference
  $__global.callServer = callServer;

  // prepare initial layout data from inline <script>
  // TODO: needs to await for hydration formState. does it affect startup perf?
  const initialLayout =
    await reactServerDomClient.createFromReadableStream<ServerRouterData>(
      readStreamScript<string>().pipeThrough(new TextEncoderStream()),
      { callServer },
    );
  const initialLayoutPromise = Promise.resolve(initialLayout);

  //
  // browser root
  //

  function LayoutHandler(props: React.PropsWithChildren) {
    const [layoutPromise, setLayoutPromise] =
      React.useState<Promise<ServerRouterData>>(initialLayoutPromise);

    // very shaky trick to merge with current layout
    $__setLayout = (nextPromise) => {
      setLayoutPromise(
        memoize(async (currentPromise: Promise<ServerRouterData>) => {
          const current = await currentPromise;
          const next = await nextPromise;
          return {
            action: next.action,
            layout: {
              ...current.layout,
              ...next.layout,
            },
          } satisfies ServerRouterData;
        }),
      );
    };

    const [isPending, startTransition] = React.useTransition();
    const [isActionPending, startActionTransition] = React.useTransition();
    $__startActionTransition = startActionTransition;

    React.useEffect(() => router.setup(), []);

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
      const request = new Request(
        wrapStreamRequestUrl(location.href, {
          lastPathname,
          revalidate: ROUTER_REVALIDATE_KEY in location.state,
        }),
      );
      startTransition(() => {
        $__setLayout(
          reactServerDomClient.createFromFetch<ServerRouterData>(
            fetch(request),
            {
              callServer,
            },
          ),
        );
      });
    }, [location]);

    return (
      <LayoutStateContext.Provider value={{ data: layoutPromise }}>
        {props.children}
      </LayoutStateContext.Provider>
    );
  }

  let reactRootEl = (
    <RouterContext.Provider value={router}>
      <RootErrorBoundary>
        <LayoutHandler>
          <LayoutRoot />
        </LayoutHandler>
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
    reactDomClient.createRoot(document).render(reactRootEl);
  } else {
    reactDomClient.hydrateRoot(document, reactRootEl, {
      // @ts-expect-error no type yet
      formState: initialLayout.action?.data,
    });
  }

  // custom event for RSC reload
  if (import.meta.hot) {
    import.meta.hot.on("rsc:update", (e) => {
      console.log("[react-server] hot update", e.file);
      history.replace(history.location.href, routerRevalidate());
    });
  }
}

declare module "react-dom/client" {
  // TODO: full document CSR works fine?
  interface DO_NOT_USE_OR_YOU_WILL_BE_FIRED_EXPERIMENTAL_CREATE_ROOT_CONTAINERS {
    Document: Document;
  }
}
