import type { IncomingMessage, OutgoingMessage } from "node:http";
import {
  createClientReferenceConfig,
  initializeReactServer,
} from "@hiogawa/vite-rsc/core/server";

// @ts-ignore
import ReactServer from "react-server-dom-webpack/server";

export default async function handler(
  _req: IncomingMessage,
  res: OutgoingMessage,
) {
  initializeReactServer();

  const stream = ReactServer.renderToPipeableStream(
    <h1>rsc-ok</h1>,
    createClientReferenceConfig(),
  );

  res.setHeader("Content-Type", "text/x-component;charset=utf-8");
  stream.pipe(res);
}

if (import.meta.hot) {
  import.meta.hot.accept();
}
