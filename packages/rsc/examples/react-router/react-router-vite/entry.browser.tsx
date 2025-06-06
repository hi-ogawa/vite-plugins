import {
  createFromReadableStream,
  encodeReply,
  initialize,
  setServerCallback,
} from "@hiogawa/vite-rsc/browser";
import * as React from "react";
import { hydrateRoot } from "react-dom/client";
import {
  unstable_RSCHydratedRouter as RSCHydratedRouter,
  unstable_createCallServer as createCallServer,
  unstable_getServerStream as getServerStream,
} from "react-router";
import type { unstable_ServerPayload as ServerPayload } from "react-router/rsc";

initialize({
  onHmrReload() {
    // currently handle by `<ServerHmr />` in `root.client.tsx`
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
