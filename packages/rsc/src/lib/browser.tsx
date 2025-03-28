import ReactDomClient from "react-dom/client";
import ReactClient from "react-server-dom-webpack/client.browser";
import type { RscPayload } from "./server";
import { getRscScript } from "./utils/rsc-script";

export async function hydrate(options?: {
  serverCallback?: () => void;
  onHmrReload?: () => void;
}): Promise<void> {
  // TODO
  options?.serverCallback;

  const initialPayload = await ReactClient.createFromReadableStream<RscPayload>(
    getRscScript(),
    {},
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
