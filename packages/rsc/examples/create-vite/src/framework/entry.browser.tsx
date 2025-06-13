import * as ReactClient from "@hiogawa/vite-rsc/browser";
import React from "react";
import * as ReactDOMClient from "react-dom/client";
import type { RscPayload } from "./entry.rsc";

// TODO: explain

async function main() {
  // register handler which will be internally called by React
  // on server function request.
  ReactClient.setServerCallback(async (id, args) => {
    // the implementation can be vary, but a standard way is to
    // - browser
    // -   call POST request with (id, args) encoded in payload
    // - server
    //   - decoded (id, args) and execute corresponding server function
    //   - re-render RSC stream
    // - browser
    //   - deserialize RSC stream and re-render React tree
    // which would achieves single round trip to mutate and fetch from server.
    const url = new URL(window.location.href);
    const temporaryReferences = ReactClient.createTemporaryReferenceSet();
    const payload = await ReactClient.createFromFetch<RscPayload>(
      fetch(url, {
        method: "POST",
        body: await ReactClient.encodeReply(args, { temporaryReferences }),
        headers: {
          "x-rsc-action": id,
        },
      }),
      { temporaryReferences },
    );
    setPayload(payload);
    return payload.returnValue;
  });

  // deserialize to React tree for traditional CSR
  const initialPayload = await ReactClient.createFromFetch<RscPayload>(
    fetch(window.location.href),
  );
  // const initialPayload = await ReactClient.createFromReadableStream<RscPayload>(rscStream);

  // re-fetch and re-render RSC payload on navigation
  async function fetchRscPayload() {
    const url = new URL(window.location.href);
    const payload = await ReactClient.createFromFetch<RscPayload>(fetch(url));
    setPayload(payload);
  }

  // stash `setPayload` function to trigger re-rendering
  // from outside of `BrowserRoot` component (e.g. server function call, navigation, hmr)
  let setPayload: (v: RscPayload) => void;

  // browser root component to re-render RSC payload
  // on navigation and server function call
  function BrowserRoot() {
    const [payload, setPayload_] = React.useState(initialPayload);

    React.useEffect(() => {
      setPayload = (v) => React.startTransition(() => setPayload_(v));
    }, [setPayload_]);

    React.useEffect(() => {
      return listenNavigation(() => fetchRscPayload());
    }, []);

    return payload.root;
  }

  const browserRoot = (
    <React.StrictMode>
      <BrowserRoot />
    </React.StrictMode>
  );

  // hydrate html
  ReactDOMClient.hydrateRoot(document, browserRoot, {
    formState: initialPayload.formState,
  });

  // implement server HMR by trigering re-fetch/render of RSC upon server code change
  if (import.meta.hot) {
    import.meta.hot.on("rsc:update", () => {
      fetchRscPayload();
    });
  }
}

// a (little) helper to intercept events for client side navigation
function listenNavigation(onNavigation: () => void) {
  window.addEventListener("popstate", onNavigation);

  const oldPushState = window.history.pushState;
  window.history.pushState = function (...args) {
    const res = oldPushState.apply(this, args);
    onNavigation();
    return res;
  };

  const oldReplaceState = window.history.replaceState;
  window.history.replaceState = function (...args) {
    const res = oldReplaceState.apply(this, args);
    onNavigation();
    return res;
  };

  function onClick(e: MouseEvent) {
    let link = (e.target as Element).closest("a");
    if (
      link &&
      link instanceof HTMLAnchorElement &&
      link.href &&
      (!link.target || link.target === "_self") &&
      link.origin === location.origin &&
      !link.hasAttribute("download") &&
      e.button === 0 && // left clicks only
      !e.metaKey && // open in new tab (mac)
      !e.ctrlKey && // open in new tab (windows)
      !e.altKey && // download
      !e.shiftKey &&
      !e.defaultPrevented
    ) {
      e.preventDefault();
      history.pushState(null, "", link.href);
    }
  }
  document.addEventListener("click", onClick);

  return () => {
    document.removeEventListener("click", onClick);
    window.removeEventListener("popstate", onNavigation);
    window.history.pushState = oldPushState;
    window.history.replaceState = oldReplaceState;
  };
}

main();
