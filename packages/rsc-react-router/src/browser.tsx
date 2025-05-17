import {
  createFromReadableStream,
  encodeReply,
  initialize,
  setServerCallback,
} from "@hiogawa/vite-rsc/browser";
import * as React from "react";
import { hydrateRoot } from "react-dom/client";
import {
  RSCHydratedRouter,
  createCallServer,
  getServerStream,
} from "react-router";
import type { ServerPayload } from "react-router/rsc";

initialize({
  onHmrReload() {
    // TODO: refetch on server change?
    window.location.reload();
  },
});

setServerCallback(
  createCallServer({
    decode: (body) => createFromReadableStream(body),
    encodeAction: (args) => encodeReply(args),
  }),
);

createFromReadableStream<ServerPayload>(getServerStream()).then(
  (payload: ServerPayload) => {
    React.startTransition(() => {
      hydrateRoot(
        document,
        <React.StrictMode>
          <RSCHydratedRouter
            decode={(body) => createFromReadableStream(body)}
            payload={payload as any}
          />
        </React.StrictMode>,
      );
    });
  },
);
