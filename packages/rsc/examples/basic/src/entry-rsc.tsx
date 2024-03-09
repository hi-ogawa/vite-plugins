import reactServerDomServer from "react-server-dom-webpack/server.edge";
import { devBundlerConfig } from "./config-rsc";
import { Root } from "./root";

export default function renderRsc(): ReadableStream<Uint8Array> {
  console.log("-> reactServerDomServer.renderToReadableStream");
  const rscStream = reactServerDomServer.renderToReadableStream(
    <Root />,
    devBundlerConfig
  );
  console.log("<- reactServerDomServer.renderToReadableStream");
  return rscStream;
}
