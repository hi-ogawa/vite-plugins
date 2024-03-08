import type http from "node:http";
import { Readable } from "node:stream";
import React from "react";
import reactDomServer from "react-dom/server.edge";
import reactServerDomClient from "react-server-dom-webpack/client.edge";
import { injectRSCPayload } from "rsc-html-stream/server";
import type { RscServer } from "../vite.config";
import { myModuleMap, myWebpackRequire } from "./components/counter";

// injected by vitePluginRscServer
declare let __rscServer: RscServer;

Object.assign(globalThis, {
  __webpack_require__: myWebpackRequire,
});

export default async function handler(
  _req: http.IncomingMessage,
  res: http.ServerResponse
) {
  const rscStream = await __rscServer.render();
  const [rscStream1, rscStream2] = rscStream.tee();

  let node: Promise<React.ReactNode>;
  function Content() {
    console.log("-> reactServerDomClient.createFromReadableStream");
    node ??= reactServerDomClient.createFromReadableStream(rscStream1, {
      ssrManifest: {
        moduleMap: myModuleMap,
        moduleLoading: null,
      },
    });
    return React.use(node);
  }

  console.log("-> reactDomServer.renderToReadableStream");
  const htmlStream = await reactDomServer.renderToReadableStream(<Content />);
  console.log("<- reactDomServer.renderToReadableStream");
  const resStream = htmlStream.pipeThrough(injectRSCPayload(rscStream2));

  res.setHeader("content-type", "text/html");
  Readable.fromWeb(resStream as any).pipe(res);
}
