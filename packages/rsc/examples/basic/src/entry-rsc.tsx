import reactServerDomServer from "react-server-dom-webpack/server.edge";
import { myBundlerConfig } from "./config-rsc";
import { Root } from "./root";

export type RenderRsc = () => ReadableStream;

export default function renderRsc() {
  console.log("-> reactServerDomServer.renderToReadableStream");
  const rscStream = reactServerDomServer.renderToReadableStream(
    <Root />,
    myBundlerConfig
  );
  console.log("<- reactServerDomServer.renderToReadableStream");
  return rscStream;
}
