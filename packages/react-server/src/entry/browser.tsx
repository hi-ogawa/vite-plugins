import { createDebug, tinyassert } from "@hiogawa/utils";
import { createBrowserHistory } from "@tanstack/history";
import React from "react";
import reactDomClient from "react-dom/client";
import { rscStream } from "rsc-html-stream/client";
import { RouterContext, ServerTransitionContext } from "../lib/client/router";
import { initDomWebpackCsr } from "../lib/csr";
import { __global } from "../lib/global";
import { injectActionId, wrapRscRequestUrl } from "../lib/shared";
import type { CallServerCallback } from "../lib/types";

// TODO: root error boundary? suspense?
const debug = createDebug("react-server:browser");

export async function start() {
  initDomWebpackCsr();

  const { default: reactServerDomClient } = await import(
    "react-server-dom-webpack/client.browser"
  );

  const history = createBrowserHistory();

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

    React.useEffect(() => {
      debug("[isPending]", isPending);
    }, [isPending]);

    React.useEffect(() => {
      debug("[isActionPending]", isActionPending);
    }, [isActionPending]);

    React.useEffect(() => {
      // TODO: back navigation doesn't trigger `isPending?
      return history.subscribe(() => {
        debug("[history]", history.location.href);

        const request = new Request(wrapRscRequestUrl(history.location.href));
        const newRsc = reactServerDomClient.createFromFetch(fetch(request), {
          callServer,
        });
        // delay transition after useRouter's re-render is committed for back/forward navigation
        // TODO: why normal history.push works?
        setTimeout(() => startTransition(() => setRsc(newRsc)));
      });
    }, []);

    const rscRoot = React.use(rsc);
    return (
      <ServerTransitionContext.Provider value={{ isPending, isActionPending }}>
        {rscRoot}
      </ServerTransitionContext.Provider>
    );
  }

  let reactRootEl = (
    <RouterContext.Provider value={{ history }}>
      <Root />
    </RouterContext.Provider>
  );
  if (0) {
    // TODO: investigate StrictMode issue
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
      history.notify();
    });
  }
}

declare module "react-dom/client" {
  // TODO: full document CSR works fine?
  interface DO_NOT_USE_OR_YOU_WILL_BE_FIRED_EXPERIMENTAL_CREATE_ROOT_CONTAINERS {
    Document: Document;
  }
}
