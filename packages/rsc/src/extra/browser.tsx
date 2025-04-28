import React from "react";
import ReactDomClient from "react-dom/client";
import {
  type CallServerCallback,
  createFromFetch,
  createFromReadableStream,
  createTemporaryReferenceSet,
  encodeReply,
  initialize,
  setServerCallback,
} from "../browser";
import type { RscPayload } from "./rsc";
import { getRscScript } from "./utils/rsc-script";

export async function hydrate(options?: {
  serverCallback?: () => void;
  onHmrReload?: () => void;
}): Promise<void> {
  initialize({
    onHmrReload() {
      window.history.replaceState({}, "", window.location.href);
      options?.onHmrReload?.();
    },
  });

  function findSourceMapURL(filename: string, environmentName: string) {
    if (!import.meta.env.DEV) return null;
    // TODO: respect config.server.origin and config.base?
    const url = new URL("/__vite_rsc_findSourceMapURL", window.location.origin);
    url.searchParams.set("filename", filename);
    url.searchParams.set("environmentName", environmentName);
    return url.toString();
  }

  const rscOptions = { findSourceMapURL };

  const callServer: CallServerCallback = async (id, args) => {
    const url = new URL(window.location.href);
    const temporaryReferences = createTemporaryReferenceSet();
    const payload = await createFromFetch<RscPayload>(
      fetch(url, {
        method: "POST",
        body: await encodeReply(args, { temporaryReferences }),
        headers: {
          "x-rsc-action": id,
        },
      }),
      { temporaryReferences, ...rscOptions },
    );
    setPayload(payload);
    return payload.returnValue;
  };
  setServerCallback(callServer);

  async function onNavigation() {
    const url = new URL(window.location.href);
    const payload = await createFromFetch<RscPayload>(fetch(url), rscOptions);
    setPayload(payload);
  }

  if (window.location.search.includes("no-hydrate")) {
    return;
  }

  const initialPayload = await createFromReadableStream<RscPayload>(
    getRscScript(),
    rscOptions,
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
}

export async function fetchRSC(
  request: string | URL | Request,
): Promise<RscPayload["root"]> {
  const payload = await createFromFetch<RscPayload>(fetch(request));
  return payload.root;
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
