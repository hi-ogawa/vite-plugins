import reactServerDomServer from "react-server-dom-webpack/server.edge";
import { myBundlerConfig, myWebpackRequire } from "./components/counter";
import { Root } from "./root";

// TODO: need different __webpack_require__ for SSR and RSC
Object.assign(globalThis, {
  __webpack_require__: myWebpackRequire,
});

export default async function render() {
  console.log("-> reactServerDomServer.renderToReadableStream");
  const rscStream = reactServerDomServer.renderToReadableStream(
    <Root />,
    myBundlerConfig
  );
  console.log("<- reactServerDomServer.renderToReadableStream");
  return rscStream;
}
