import reactServerDomServer from "react-server-dom-webpack/server.edge";
import { bundlerConfig } from "./lib/rsc";
import { Page } from "./routes/index.page";

export default function renderRsc() {
  console.log("-> reactServerDomServer.renderToReadableStream");
  const rscStream = reactServerDomServer.renderToReadableStream(
    <Page />,
    bundlerConfig
  );
  console.log("<- reactServerDomServer.renderToReadableStream");
  return { rscStream };
}
