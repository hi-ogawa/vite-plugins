import { tinyassert } from "@hiogawa/utils";
import React from "react";
import reactDomClient from "react-dom/client";
import { rscStream } from "rsc-html-stream/client";
import { ServerComponentTransitionContext } from "../lib/client/router";
import { __history, initDomWebpackCsr, initHistory } from "../lib/csr";
import { debug } from "../lib/debug";
import { __global } from "../lib/global";
import { injectActionId, wrapRscRequestUrl } from "../lib/shared";
// import type { CallServerCallback } from "../lib/types";

// TODO: root error boundary? suspense?

export async function start() {
  initDomWebpackCsr();
  initHistory();

  const { default: reactServerDomClient } = await import(
    "react-server-dom-webpack/client.browser"
  );

  // swtich root rsc on navigaton and server action
  // let __setRsc: (v: Promise<React.ReactNode>) => void;

  // function updateRscByFetch(request: Request) {
  //   const newRsc = reactServerDomClient.createFromFetch(fetch(request), {
  //     callServer,
  //   });
  //   React.startTransition(() => __setRsc(newRsc));
  // }

  // server action callback
  // TODO: separate useTransition
  // const callServer: CallServerCallback = async (id, args) => {
  //   debug("callServer", { id, args });
  //   if (0) {
  //     // TODO: proper encoding?
  //     await reactServerDomClient.encodeReply(args);
  //   } else {
  //     // $ACTION_ID is injected during SSR
  //     // but it can stripped away on client re-render (e.g. HMR?)
  //     // so we do it here again to inject on client.
  //     tinyassert(args[0] instanceof FormData);
  //     injectActionId(args[0], id);
  //   }
  //   const request = new Request(wrapRscRequestUrl(__history.location.href), {
  //     method: "POST",
  //     body: args[0],
  //   });
  //   const newRsc = reactServerDomClient.createFromFetch(fetch(request), {
  //     callServer,
  //   });
  //   __setRsc(newRsc);
  //   // updateRscByFetch(request);
  // };

  // expose as global to be used for createServerReference
  // __global.callServer = callServer;

  // initial rsc stream from inline <script>
  const initialRsc = reactServerDomClient.createFromReadableStream(rscStream, {
    // callServer,
  });

  function Root() {
    const [isPending, startTransition] = React.useTransition();
    // TODO: tell which action is pending?
    const [isActionPending, startActionTransition] = React.useTransition();
    isPending;
    startTransition;
    startActionTransition;
    ServerComponentTransitionContext;

    const [rsc, setRsc] = React.useState(initialRsc);
    // __setRsc = setRsc;

    React.useLayoutEffect(() => {
      if (typeof __global.callServer !== "undefined") {
        return;
      }
      __global.callServer = async (id, args) => {
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
        const request = new Request(
          wrapRscRequestUrl(__history.location.href),
          {
            method: "POST",
            body: args[0],
          },
        );
        const newRsc = reactServerDomClient.createFromFetch(fetch(request), {
          // callServer,
        });
        startActionTransition(() => setRsc(newRsc));
      };
    }, []);

    React.useLayoutEffect(() => {
      return __history.subscribe(() => {
        debug("history", __history.location.href);

        const request = new Request(wrapRscRequestUrl(__history.location.href));
        const newRsc = reactServerDomClient.createFromFetch(fetch(request), {
          // callServer,
        });
        startTransition(() => setRsc(newRsc));
      });
    }, []);

    const rscRoot = React.use(rsc);
    return (
      <ServerComponentTransitionContext.Provider
        value={{ isPending, isActionPending }}
      >
        {rscRoot}
      </ServerComponentTransitionContext.Provider>
    );
  }

  // full client render on SSR error
  if (document.documentElement.dataset["noHydate"]) {
    reactDomClient.createRoot(document).render(
      <React.StrictMode>
        <Root />
      </React.StrictMode>,
    );
  } else {
    reactDomClient.hydrateRoot(
      document,
      <React.StrictMode>
        <Root />
      </React.StrictMode>,
    );
  }

  // custom event for RSC reload
  if (import.meta.hot) {
    import.meta.hot.on("rsc:update", (e) => {
      console.log("[react-server] hot update", e);
      __history.notify();
    });
  }
}

declare module "react-dom/client" {
  // TODO: full document CSR works fine?
  interface DO_NOT_USE_OR_YOU_WILL_BE_FIRED_EXPERIMENTAL_CREATE_ROOT_CONTAINERS {
    Document: Document;
  }
}
