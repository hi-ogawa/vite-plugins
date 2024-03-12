import "./style.css";
import { tinyassert } from "@hiogawa/utils";
import React from "react";
import { hydrateRoot } from "react-dom/client";
import { rscStream } from "rsc-html-stream/client";
import { __history, initDomWebpackCsr, initHistory } from "./lib/csr";
import { wrapRscRequestUrl } from "./lib/shared";

// TODO: root error boundary?

async function main() {
  initDomWebpackCsr();
  initHistory();

  const { default: reactServerDomClient } = await import(
    "react-server-dom-webpack/client.browser"
  );

  const initialRsc = reactServerDomClient.createFromReadableStream(rscStream, {
    callServer: async (id, args) => {
      console.log("[callServer]", { id, args });
    },
  });

  function Root() {
    const [rsc, setRsc] = React.useState(initialRsc);
    React.useEffect(() => {
      return __history.subscribe(() => {
        console.log("[history:change]", __history.location.href);
        const newRsc = reactServerDomClient.createFromFetch(
          fetch(wrapRscRequestUrl(__history.location.href)),
          {
            callServer: async (id, args) => {
              console.log("[callServer]", { id, args });
            },
          }
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

// custom event for RSC reload
if (import.meta.hot) {
  import.meta.hot.on("rsc:update", (e) => {
    console.log("[rsc] hot update", e);
    __history.notify();
  });
}
