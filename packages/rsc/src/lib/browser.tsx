import "./features/client-component/browser-init";
import React from "react";
import ReactDomClient from "react-dom/client";
import type { RscPayload } from "./server";
import type { CallServerCallback } from "./types";
import { getRscScript } from "./utils/rsc-script";

export async function hydrate(options?: {
  serverCallback?: () => void;
  onHmrReload?: () => void;
}): Promise<void> {
  // delay import to ensure __webpack_require__ is defined
  const { default: ReactClient } = await import(
    "react-server-dom-webpack/client.browser"
  );

  const callServer: CallServerCallback = async (id, args) => {
    const url = new URL(window.location.href);
    url.searchParams.set("__rsc", id);
    const payload = await ReactClient.createFromFetch<RscPayload>(
      fetch(url, {
        method: "POST",
        body: await ReactClient.encodeReply(args),
      }),
      { callServer },
    );
    setPayload(payload);
    return payload.returnValue;
  };
  globalThis.__viteRscCallServer = callServer;

  async function onNavigation() {
    const url = new URL(window.location.href);
    url.searchParams.set("__rsc", "");
    const payload = await ReactClient.createFromFetch<RscPayload>(fetch(url), {
      callServer,
    });
    setPayload(payload);
  }

  if (window.location.search.includes("no-hydrate")) {
    return;
  }

  const initialPayload = await ReactClient.createFromReadableStream<RscPayload>(
    getRscScript(),
    {
      callServer,
    },
  );

  let setPayload: (v: RscPayload) => void;

  function BrowserRoot() {
    const [payload, setPayload_] = React.useState(initialPayload);

    React.useEffect(() => {
      setPayload = (v) => React.startTransition(() => setPayload_(v));
    }, [setPayload_]);

    React.useEffect(() => {
      return listenNavigation(() => onNavigation());
    }, []);

    return payload.root;
  }

  ReactDomClient.hydrateRoot(document, <BrowserRoot />, {
    formState: initialPayload.formState,
  });

  if (import.meta.hot) {
    import.meta.hot.on("rsc:update", () => {
      window.history.replaceState({}, "", window.location.href);
      options?.onHmrReload?.();
    });
  }
}

export async function fetchRSC(): Promise<void> {
  // TODO
}

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
