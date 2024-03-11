import "virtual:uno.css";
import { tinyassert } from "@hiogawa/utils";
import React from "react";
import { hydrateRoot } from "react-dom/client";
import { rscStream } from "rsc-html-stream/client";
import { __history, initDomWebpackCsr, initHistory } from "./lib/csr";
import { moduleMap, wrapRscRequestUrl } from "./lib/shared";

// TODO: root error boundary

async function main() {
  initDomWebpackCsr();
  initHistory();

  const { default: reactServerDomClient } = await import(
    "react-server-dom-webpack/client.browser"
  );

  const initialRsc = reactServerDomClient.createFromReadableStream(rscStream, {
    ssrManifest: {
      moduleMap: moduleMap,
      moduleLoading: null,
    },
  });

  function Root() {
    const [rsc, setRsc] = React.useState(initialRsc);
    React.useEffect(() => {
      return __history.subscribe(() => {
        const newRsc = reactServerDomClient.createFromFetch(
          fetch(wrapRscRequestUrl(__history.location.href))
        );
        // TODO: transition?
        setRsc(newRsc);
      });
    }, []);
    return React.use(rsc);
  }

  const rootEl = document.getElementById("root");
  tinyassert(rootEl);

  hydrateRoot(
    rootEl,
    <React.StrictMode>
      <Root />
    </React.StrictMode>
  );
}

main();
