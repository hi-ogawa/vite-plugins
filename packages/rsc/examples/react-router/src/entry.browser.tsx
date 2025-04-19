import { initialize, setServerCallback } from "@hiogawa/vite-rsc/core2/browser";
import * as React from "react";
import { hydrateRoot } from "react-dom/client";
import {
  RSCHydratedRouter,
  createCallServer,
  getServerStream,
} from "react-router";
import type { ServerPayload } from "react-router/rsc";
// @ts-ignore
import * as ReactClient from "react-server-dom-webpack/client";

initialize({
  onHmrReload() {
    // TODO: refetch on server change?
  },
});

const callServer = createCallServer({
  decode: (body) => ReactClient.createFromReadableStream(body, { callServer }),
  encodeAction: (args) => ReactClient.encodeReply(args),
});

setServerCallback(callServer);

ReactClient.createFromReadableStream(getServerStream(), {
  callServer,
}).then((payload: ServerPayload) => {
  React.startTransition(() => {
    hydrateRoot(
      document,
      <React.StrictMode>
        <RSCHydratedRouter
          decode={(body) =>
            ReactClient.createFromReadableStream(body, { callServer })
          }
          payload={payload as any}
        />
      </React.StrictMode>,
    );
  });
});
