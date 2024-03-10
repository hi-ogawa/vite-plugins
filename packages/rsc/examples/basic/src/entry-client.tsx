import { tinyassert } from "@hiogawa/utils";
import { hydrateRoot } from "react-dom/client";
import { rscStream } from "rsc-html-stream/client";
import { initDomWebpackCsr } from "./lib/csr";
import { moduleMap } from "./lib/shared";

async function main() {
  initDomWebpackCsr();

  const { default: reactServerDomClient } = await import(
    "react-server-dom-webpack/client.browser"
  );

  console.log("-> reactServerDomClient.createFromReadableStream");
  const rscEl = await reactServerDomClient.createFromReadableStream(rscStream, {
    ssrManifest: {
      moduleMap: moduleMap,
      moduleLoading: null,
    },
  });
  console.log("<- reactServerDomClient.createFromReadableStream");

  const rootEl = document.getElementById("root");
  tinyassert(rootEl);
  console.log("-> hydrateRoot");
  const root = hydrateRoot(rootEl, rscEl);
  console.log("<- hydrateRoot");
  console.log({ root });
}

main();
