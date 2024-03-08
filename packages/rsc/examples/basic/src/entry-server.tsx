import "./react-fix";
import type http from "node:http";
import { Readable } from "node:stream";
import React from "react";
import reactDomServer from "react-dom/server.edge";
import reactServerDomClient from "react-server-dom-webpack/client.edge";
import reactServerDomServer from "react-server-dom-webpack/server.edge";
import { injectRSCPayload } from "rsc-html-stream/server";
import { Root } from "./root";

// https://github.com/dai-shi/waku/blob/4d16c28a58204991de2985df0d202f21a48ae1f9/packages/waku/src/lib/renderers/html-renderer.ts
// https://github.com/devongovett/rsc-html-stream

export default async function handler(
  _req: http.IncomingMessage,
  res: http.ServerResponse
) {
  console.log("-> reactServerDomServer.renderToReadableStream");
  const rscStream = reactServerDomServer.renderToReadableStream(
    <Root />,
    new Proxy(
      {},
      {
        get(_target, p, _receiver) {
          console.log("[bundlerConfig.get]", { p });
          return {
            id: "rsc-foo-id",
            chunks: [],
            name: "rsc-foo-name",
          };
        },
      }
    )
  );
  console.log("<- reactServerDomServer.renderToReadableStream");
  const [rscStream1, rscStream2] = rscStream.tee();

  // let p = Promise.resolve(new Proxy({}, {
  //   get(_target, p, _receiver) {
  //     console.log("[moduele]", { p })
  //     if (p === "client-foo-name") {
  //       return () => <div>hey?</div>;
  //     }
  //   },
  // }));
  let p = Promise.resolve({
    "client-foo-name": () => {
      return <div>fofo</div>;
    },
  });
  Object.assign(globalThis, {
    __webpack_require__: (id: string) => {
      console.log("[__webpack_require__]", { id });
      return p;
      // return Promise.resolve("foo");
      // return (async () => {
      //   return <div>__webpack_require__: {id}</div>;
      // })();
    },
  });

  let node: Promise<React.ReactNode>;
  function Content() {
    console.log("-> reactServerDomClient.createFromReadableStream");
    node ??= reactServerDomClient.createFromReadableStream(rscStream1, {
      ssrManifest: {
        moduleMap: new Proxy(
          {},
          {
            get(_target, p, _receiver) {
              console.log("[ssrManifest.moduleMap.get]", { p });
              return new Proxy(
                {},
                {
                  get(_target, q, _receiver) {
                    console.log("[ssrManifest.moduleMap.get]", { p, q });
                    return {
                      id: "client-foo-id",
                      chunks: [],
                      name: "client-foo-name",
                    };
                  },
                }
              );
            },
          }
        ),
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
