import * as ReactClient from "@hiogawa/vite-rsc/react/browser";
import React from "react";
import ReactDomClient from "react-dom/client";
import { rscStream } from "rsc-html-stream/client";

function main() {
  ReactClient.setRequireModule({
    load(id) {
      return import(/* @vite-ignore */ id);
    },
  });

  let payload: Promise<React.ReactNode>;
  function BrowserRoot() {
    payload ??= ReactClient.createFromReadableStream(rscStream);
    return React.use(payload);
  }

  ReactDomClient.hydrateRoot(document, <BrowserRoot />);
}

main();
