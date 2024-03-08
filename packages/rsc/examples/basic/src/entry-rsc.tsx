import reactServerDomServer from "react-server-dom-webpack/server.edge";
import { myBundlerConfig } from "./components/counter";
import { globalConetxt } from "./globals-server";
import { Root } from "./root";

export default async function render() {
  return globalConetxt.run({ isRsc: true }, () => renderInner());
}

function renderInner() {
  console.log("-> reactServerDomServer.renderToReadableStream");
  const rscStream = reactServerDomServer.renderToReadableStream(
    <Root />,
    myBundlerConfig
  );
  console.log("<- reactServerDomServer.renderToReadableStream");
  return rscStream;
}
