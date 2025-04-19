import * as React from "react";
import { hydrateRoot } from "react-dom/client";
import {
  RSCHydratedRouter,
  createCallServer,
  getServerStream,
} from "react-router";
import type { ServerPayload } from "react-router/rsc";
import * as ReactClient from "react-server-dom-webpack/client";

const callServer = createCallServer({
  decode: (body) => ReactClient.createFromReadableStream(body, { callServer }),
  encodeAction: (args) => ReactClient.encodeReply(args),
});

// setServerCallback(callServer);

ReactClient.createFromReadableStream(getServerStream(), {
  assets: "manifest",
}).then((payload: ServerPayload) => {
  React.startTransition(() => {
    hydrateRoot(
      document,
      React.createElement(
        React.StrictMode,
        null,
        React.createElement(RSCHydratedRouter, {
          decode: (body) => ReactClient.createFromReadableStream(body),
          payload: payload as any,
        }),
      ),
    );
  });
});
