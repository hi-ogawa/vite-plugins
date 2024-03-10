import { tinyassert } from "@hiogawa/utils";
import React from "react";
import { hydrateRoot } from "react-dom/client";
import { rscStream } from "rsc-html-stream/client";
import { initDomWebpackCsr } from "./lib/csr";
import { moduleMap } from "./lib/shared";

// TODO: root error boundary

async function main() {
  initDomWebpackCsr();

  const { default: reactServerDomClient } = await import(
    "react-server-dom-webpack/client.browser"
  );

  const rscPromise = reactServerDomClient.createFromReadableStream(rscStream, {
    ssrManifest: {
      moduleMap: moduleMap,
      moduleLoading: null,
    },
  });

  function Root() {
    return React.use(rscPromise);
  }

  const rootEl = document.getElementById("root");
  tinyassert(rootEl);

  console.log("-> hydrateRoot");
  const root = hydrateRoot(
    rootEl,
    <React.StrictMode>
      <Root />
    </React.StrictMode>
  );
  console.log("<- hydrateRoot");
  console.log({ root });
}

main();
