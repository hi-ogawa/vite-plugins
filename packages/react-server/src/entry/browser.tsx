import { createDebug, once, tinyassert } from "@hiogawa/utils";
import { createBrowserHistory } from "@tanstack/history";
import React from "react";
import reactDomClient from "react-dom/client";
import { injectActionId } from "../features/server-action/utils";
import { wrapRscRequestUrl } from "../features/server-component/utils";
import { initializeWebpackBrowser } from "../features/use-client/browser";
import { RootErrorBoundary } from "../lib/client/error-boundary";
import { Router, RouterContext, useRouter } from "../lib/client/router";
import { __global } from "../lib/global";
import type { CallServerCallback } from "../lib/types";
import { readStreamScript } from "../utils/stream-script";

const debug = createDebug("react-server:browser");

export async function start() {
  if (window.location.search.includes("__noCsr")) {
    return;
  }

  initializeWebpackBrowser();

  const { default: reactServerDomClient } = await import(
    "react-server-dom-webpack/client.browser"
  );

  const history = createBrowserHistory();
  const initialLocation = history.location;
  const router = new Router(history);

  //
  // server action callback
  //

  // TODO: only this way?
  let __startActionTransition: React.TransitionStartFunction;
  let __setRsc: (v: Promise<React.ReactNode>) => void;

  const callServer: CallServerCallback = async (id, args) => {
    debug("callServer", { id, args });
    if (0) {
      // TODO: proper encoding?
      await reactServerDomClient.encodeReply(args);
    } else {
      // $ACTION_ID is injected during SSR
      // but it can stripped away on client re-render (e.g. HMR?)
      // so we do it here again to inject on client.
      tinyassert(args[0] instanceof FormData);
      injectActionId(args[0], id);
    }
    const request = new Request(wrapRscRequestUrl(history.location.href), {
      method: "POST",
      body: args[0],
    });
    const newRsc = reactServerDomClient.createFromFetch(fetch(request), {
      callServer,
    });
    __startActionTransition(() => __setRsc(newRsc));
  };

  // expose as global to be used for createServerReference
  __global.callServer = callServer;

  // initial rsc stream from inline <script>
  const rscStream = readStreamScript().pipeThrough(new TextEncoderStream());
  const initialRsc = reactServerDomClient.createFromReadableStream(rscStream, {
    callServer,
  });

  //
  // browser root
  //

  function Root() {
    const [isPending, startTransition] = React.useTransition();
    const [isActionPending, startActionTransition] = React.useTransition();
    const [rsc, setRsc] = React.useState(initialRsc);
    __setRsc = setRsc;
    __startActionTransition = startActionTransition;

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

    React.useEffect(
      // workaround StrictMode
      once(() => {
        if (location === initialLocation) {
          return;
        }
        debug("[history]", location.href);
        const request = new Request(wrapRscRequestUrl(location.href));
        const newRsc = reactServerDomClient.createFromFetch(fetch(request), {
          callServer,
        });
        startTransition(() => setRsc(newRsc));
      }),
      [location],
    );

    return React.use(rsc);
  }

  let reactRootEl = (
    <RouterContext.Provider value={router}>
      <RootErrorBoundary>
        <Root />
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
  if (document.documentElement.dataset["noHydate"]) {
    reactDomClient.createRoot(document).render(reactRootEl);
  } else {
    reactDomClient.hydrateRoot(document, reactRootEl);
  }

  // custom event for RSC reload
  if (import.meta.hot) {
    import.meta.hot.on("rsc:update", (e) => {
      console.log("[react-server] hot update", e);
      history.replace(history.location.href);
    });
  }
}

declare module "react-dom/client" {
  // TODO: full document CSR works fine?
  interface DO_NOT_USE_OR_YOU_WILL_BE_FIRED_EXPERIMENTAL_CREATE_ROOT_CONTAINERS {
    Document: Document;
  }
}
