import React from "react";
import { hydrateRoot } from "react-dom/client";
import reactServerDomClient from "react-server-dom-webpack/client.browser";
import { rscStream } from "rsc-html-stream/client";

function main() {
  let node: Promise<React.ReactNode>;
  function Content() {
    node ??= reactServerDomClient.createFromReadableStream(rscStream, {
      ssrManifest: {
        moduleLoading: null,
        moduleMap: null,
      },
    });
    return React.use(node);
  }

  const root = hydrateRoot(document, <Content />);
  console.log(root);
}

main();
