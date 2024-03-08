import "./react-fix";
import type http from "node:http";
import { Readable } from "node:stream";
import React from "react";
import reactDomServer from "react-dom/server.edge";
import reactServerDomClient from "react-server-dom-webpack/client.edge";
import reactServerDomServer from "react-server-dom-webpack/server.edge";
import { injectRSCPayload } from "rsc-html-stream/server";
import {
  myBundlerConfig,
  myModuleMap,
  myWebpackRequire,
} from "./components/counter";
import { Root } from "./root";

// https://github.com/dai-shi/waku/blob/4d16c28a58204991de2985df0d202f21a48ae1f9/packages/waku/src/lib/renderers/html-renderer.ts
// https://github.com/devongovett/rsc-html-stream

export default async function handler(
  _req: http.IncomingMessage,
  res: http.ServerResponse
) {
  Object.assign(globalThis, {
    __webpack_require__: myWebpackRequire,
  });

  console.log("-> reactServerDomServer.renderToReadableStream");
  const rscStream = reactServerDomServer.renderToReadableStream(
    <Root />,
    myBundlerConfig
  );
  console.log("<- reactServerDomServer.renderToReadableStream");
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
