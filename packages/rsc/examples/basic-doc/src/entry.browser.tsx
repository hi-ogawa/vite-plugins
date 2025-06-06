import * as ReactClient from "@hiogawa/vite-rsc/browser";
import * as ReactDOMClient from "react-dom/client";

async function main() {
  // fetch and deserialize RSC
  // (NOTE: extra fetch for hydration can be avoided but it's simplified for doc.)
  const rscResponse = await fetch(window.location.href + ".rsc");
  const root = await ReactClient.createFromReadableStream(rscResponse.body!);

  // hydration (traditional CSR)
  ReactDOMClient.hydrateRoot(document, root as any);
}

main();
