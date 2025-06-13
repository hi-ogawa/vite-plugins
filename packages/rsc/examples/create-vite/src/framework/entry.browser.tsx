import * as ReactClient from "@hiogawa/vite-rsc/browser";
import * as ReactDOMClient from "react-dom/client";
import type { RscPayload } from "./entry.rsc";

async function main() {
  // fetch and deserialize RSC
  const payload = await ReactClient.createFromFetch<RscPayload>(
    fetch(window.location.href + ".rsc"),
  );

  // TODO: server function

  // hydration (traditional CSR)
  const reactRoot = ReactDOMClient.hydrateRoot(document, payload.root);

  // setup server HMR by re-fetching/rendering on server code change
  if (import.meta.hot) {
    import.meta.hot.on("rsc:update", async () => {
      const payload = await ReactClient.createFromFetch<RscPayload>(
        fetch(window.location.href + ".rsc"),
      );
      reactRoot.render(payload.root);
    });
  }
}

main();
