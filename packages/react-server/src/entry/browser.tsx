import { createDebug, objectPickBy, once, tinyassert } from "@hiogawa/utils";
import { createBrowserHistory } from "@tanstack/history";
import React from "react";
import reactDomClient from "react-dom/client";
import {
  LayoutManager,
  LayoutRoot,
  PageManagerContext,
  createLayoutFromStream,
} from "../features/router/layout-manager";
import { getNewLayoutContentKeys } from "../features/router/utils";
import { injectActionId } from "../features/server-action/utils";
import { wrapRscRequestUrl } from "../features/server-component/utils";
import { initializeWebpackBrowser } from "../features/use-client/browser";
import { RootErrorBoundary } from "../lib/client/error-boundary";
import { Router, RouterContext, useRouter } from "../lib/client/router";
import { __global } from "../lib/global";
import type { CallServerCallback } from "../lib/types";
import { ndjsonParseTransform } from "../utils/stream";
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
  const router = new Router(history);
  const pageManager = new LayoutManager();

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
    // TODO: for now, we invalidate only leaf content
    const pathname = history.location.pathname;
    const newKeys = getNewLayoutContentKeys(pathname, pathname);
    const request = new Request(wrapRscRequestUrl(history.location.href), {
      method: "POST",
      body: args[0],
    });
    const clientLayoutMap = createLayoutFromStream(
      history.location.pathname,
      reactNodeFromStream,
      () => fetchLayoutStream(request),
    );
    pageManager.store.set((s) => ({
      pages: {
        ...clientLayoutMap,
        ...objectPickBy(s.pages, (_v, k) => !newKeys.includes(k)),
      },
    }));
  };

  // expose as global to be used for createServerReference
  __global.callServer = callServer;

  function reactNodeFromStream(
    stream: ReadableStream<Uint8Array>,
  ): Promise<React.ReactNode> {
    return reactServerDomClient.createFromReadableStream(stream, {
      callServer,
    });
  }

  async function fetchLayoutStream(req: Request) {
    const res = await fetch(req);
    tinyassert(res.ok);
    tinyassert(res.body);
    return res.body
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(ndjsonParseTransform());
  }

  // initial layout stream from inline <script>
  const clientLayoutMap = createLayoutFromStream(
    history.location.pathname,
    reactNodeFromStream,
    async () => readStreamScript(),
  );
  pageManager.store.set(() => ({ pages: clientLayoutMap }));

  //
  // browser root
  //

  function Root() {
    const [isPending, startTransition] = React.useTransition();
    __global.startTransition = startTransition;

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
    const lastLocation = React.useRef(location);

    React.useEffect(
      // workaround StrictMode
      once(() => {
        if (location === lastLocation.current) {
          return;
        }
        const lastPathname = lastLocation.current.pathname;
        lastLocation.current = location;

        const pathname = location.pathname;
        const newKeys = getNewLayoutContentKeys(pathname, lastPathname);
        debug("[navigation]", location, { pathname, lastPathname, newKeys });

        // TODO: request only necessary layout content
        const request = new Request(wrapRscRequestUrl(location.href));
        const clientLayoutMap = createLayoutFromStream(
          location.pathname,
          reactNodeFromStream,
          () => fetchLayoutStream(request),
        );
        pageManager.store.set((s) => ({
          pages: {
            ...clientLayoutMap,
            ...objectPickBy(s.pages, (_v, k) => !newKeys.includes(k)),
          },
        }));
      }),
      [location],
    );

    return <LayoutRoot />;
  }

  let reactRootEl = (
    <RouterContext.Provider value={router}>
      <PageManagerContext.Provider value={pageManager}>
        <RootErrorBoundary>
          <Root />
        </RootErrorBoundary>
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
