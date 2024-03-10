import reactServerDomServer from "react-server-dom-webpack/server.edge";
import { bundlerConfig } from "./lib/rsc";
import { Root } from "./root";

export default function renderRsc() {
  console.log("-> reactServerDomServer.renderToReadableStream");
  const rscStream = reactServerDomServer.renderToReadableStream(
    <Root />,
    bundlerConfig
  );
  console.log("<- reactServerDomServer.renderToReadableStream");
  return { rscStream };
}
