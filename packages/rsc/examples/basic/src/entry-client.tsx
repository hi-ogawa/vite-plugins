import { tinyassert } from "@hiogawa/utils";
import React from "react";
import { hydrateRoot } from "react-dom/client";
import { rscStream } from "rsc-html-stream/client";
import { initDomCsr, myModuleMap } from "./config-dom";

async function main() {
  initDomCsr();

  const { default: reactServerDomClient } = await import(
    "react-server-dom-webpack/client.browser"
  );

  let node: Promise<React.ReactNode>;
  function Content() {
    node ??= reactServerDomClient.createFromReadableStream(rscStream, {
      ssrManifest: {
        moduleMap: myModuleMap,
        moduleLoading: null,
      },
    });
    return React.use(node);
  }

  const rootEl = document.getElementById("root");
  tinyassert(rootEl);
  const root = hydrateRoot(rootEl, <Content />);
  console.log(root);
}

main();
