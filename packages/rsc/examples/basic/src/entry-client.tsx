import { tinyassert } from "@hiogawa/utils";
import { hydrateRoot } from "react-dom/client";
import { rscStream } from "rsc-html-stream/client";
import { devModuleMap } from "./config-dom";
import { initDomWebpackCsr } from "./config-dom-csr";

async function main() {
  initDomWebpackCsr();

  const { default: reactServerDomClient } = await import(
    "react-server-dom-webpack/client.browser"
  );

  console.log("-> reactServerDomClient.createFromReadableStream");
  const rscNode = await reactServerDomClient.createFromReadableStream(
    rscStream,
    {
      ssrManifest: {
        moduleMap: devModuleMap,
        moduleLoading: null,
      },
    }
  );
  console.log("<- reactServerDomClient.createFromReadableStream");

  const rootEl = document.getElementById("root");
  tinyassert(rootEl);
  console.log("-> hydrateRoot");
  const root = hydrateRoot(rootEl, rscNode);
  console.log("<- hydrateRoot");
  console.log({ root });
}

main();
