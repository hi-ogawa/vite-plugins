import * as ReactClient from "@hiogawa/vite-rsc/react/browser";
import React from "react";
import ReactDomClient from "react-dom/client";
import { rscStream } from "rsc-html-stream/client";
import type { RscPayload } from "./rsc";

async function main() {
  ReactClient.setRequireModule({
    load(id) {
      return import(/* @vite-ignore */ id);
    },
  });

  ReactClient.setServerCallback(async (id, args) => {
    const url = new URL(window.location.href);
    const payload = await ReactClient.createFromFetch<RscPayload>(
      fetch(url, {
        method: "POST",
        body: await ReactClient.encodeReply(args),
        headers: {
          "x-rsc-action": id,
        },
      }),
    );
    setPayload(payload);
    return payload.returnValue;
  });

  let setPayload: (v: RscPayload) => void;
  const initialPayload: RscPayload =
    await ReactClient.createFromReadableStream(rscStream);

  function BrowserRoot() {
    const [payload, setPayload_] = React.useState(initialPayload);

    React.useEffect(() => {
      setPayload = (v) => React.startTransition(() => setPayload_(v));
    }, [setPayload_]);

    return payload.root;
  }

  ReactDomClient.hydrateRoot(document, <BrowserRoot />, {
    formState: initialPayload.formState,
  });
}

main();
