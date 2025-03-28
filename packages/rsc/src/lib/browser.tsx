import ReactDomClient from "react-dom/client";
import ReactClient from "react-server-dom-webpack/client.browser";
import type { RscPayload } from "./server";
import type { CallServerCallback } from "./types";
import { getRscScript } from "./utils/rsc-script";

export async function hydrate(options?: {
  serverCallback?: () => void;
  onHmrReload?: () => void;
}): Promise<void> {
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
    // setPayload(payload);
    return payload.returnValue;
  };
  (self as any).__callServer = callServer;

  if (window.location.search.includes("no-hydrate")) {
    return;
  }

  const initialPayload = await ReactClient.createFromReadableStream<RscPayload>(
    getRscScript(),
    {
      callServer,
    },
  );

  function BrowserRoot() {
    return initialPayload.root;
  }

  ReactDomClient.hydrateRoot(document, <BrowserRoot />, {
    formState: initialPayload.formState,
  });

  if (import.meta.hot && options?.onHmrReload) {
    const onHmrReload = options?.onHmrReload;
    import.meta.hot.on("rsc:update", () => onHmrReload());
  }
}

// TODO
export function fetchRSC(): void {}
