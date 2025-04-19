import React from "react";
import ReactDomClient from "react-dom/client";
import ReactClient from "react-server-dom-webpack/client.browser";
import { setRequireModule } from "./core/client-browser";
import type { RscPayload } from "./server";
import type { CallServerCallback } from "./types";
import { getRscScript } from "./utils/rsc-script";

export function initialize(options?: {
  onHmrReload: () => void;
}): void {
  setRequireModule({
    load: async (id) => {
      if (import.meta.env.DEV) {
        // TODO
        if ((self as any).__viteRscRawImport) {
          return (self as any).__viteRscRawImport(id);
        }
        return import(/* @vite-ignore */ id);
      } else {
        const clientReferences = await import(
          "virtual:vite-rsc/client-references" as any
        );
        const import_ = clientReferences.default[id];
        if (!import_) {
          throw new Error(`client reference not found '${id}'`);
        }
        return import_();
      }
    },
  });

  if (import.meta.hot) {
    import.meta.hot.on("rsc:update", () => {
      options?.onHmrReload?.();
    });
  }
}

export function setServerCallback(fn: any): void {
  globalThis.__viteRscCallServer = fn;
}

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

  const callServer: CallServerCallback = async (id, args) => {
    const url = new URL(window.location.href);
    const payload = await ReactClient.createFromFetch<RscPayload>(
      fetch(url, {
        method: "POST",
        body: await ReactClient.encodeReply(args),
        headers: {
          "x-rsc-action": id,
        },
      }),
      { callServer },
    );
    setPayload(payload);
    return payload.returnValue;
  };
  setServerCallback(callServer);

  async function onNavigation() {
    const url = new URL(window.location.href);
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
}

export async function fetchRSC(
  request: string | URL | Request,
): Promise<RscPayload["root"]> {
  const payload = await ReactClient.createFromFetch<RscPayload>(
    fetch(request),
    {},
  );
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
