import { createDebug, once, tinyassert } from "@hiogawa/utils";
import { createBrowserHistory } from "@tanstack/history";
import React from "react";
import reactDomClient from "react-dom/client";
import { rscStream } from "rsc-html-stream/client";
import {
  PageManager,
  PageManagerContext,
  usePageManager,
} from "../lib/client/page-manager";
import { Router, RouterContext, useRouter } from "../lib/client/router";
import { initDomWebpackCsr } from "../lib/csr";
import { __global } from "../lib/global";
import { injectActionId, wrapRscRequestUrl } from "../lib/shared";
import type { CallServerCallback } from "../lib/types";

const debug = createDebug("react-server:browser");

export async function start() {
  initDomWebpackCsr();

  const { default: reactServerDomClient } = await import(
    "react-server-dom-webpack/client.browser"
  );

  const history = createBrowserHistory();
  const initialLocation = history.location;
  const router = new Router(history);
  const pageManager = new PageManager();

  //
  // server action callback
  //

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
    pageManager.store.set(() => ({ pages: { __root: newRsc } }));
  };

  // expose as global to be used for createServerReference
  __global.callServer = callServer;

  // initial rsc stream from inline <script>
  const initialRsc = reactServerDomClient.createFromReadableStream(rscStream, {
    callServer,
  });
  pageManager.store.set(() => ({ pages: { __root: initialRsc } }));

  //
  // browser root
  //

  function Root() {
    const [isPending, startTransition] = React.useTransition();
    // TODO: for now, no action pending state
    const [isActionPending, _startActionTransition] = React.useTransition();

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
        pageManager.store.set(() => ({ pages: { __root: newRsc } }));
      }),
      [location],
    );

    // wrap root switch as transition
    const page = usePageManager((s) => s.pages["__root"]!);
    const [page2, setPage] = React.useState(page);
    React.useEffect(() => {
      if (page2 !== page) {
        startTransition(() => setPage(page));
      }
    }, [page2, page]);
    return React.use(page2);
  }

  // TODO: root error boundary? suspense?
  let reactRootEl = (
    <RouterContext.Provider value={router}>
      <PageManagerContext.Provider value={pageManager}>
        <Root />
      </PageManagerContext.Provider>
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
