import React from "react";
import { hydrateRoot } from "react-dom/client";
import { rscStream } from "rsc-html-stream/client";
import { myModuleMap, myWebpackRequire } from "./config-dom";

async function main() {
  Object.assign(globalThis, {
    __webpack_require__: myWebpackRequire,
  });
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

  const root = hydrateRoot(document, <Content />);
  console.log(root);
}

main();
