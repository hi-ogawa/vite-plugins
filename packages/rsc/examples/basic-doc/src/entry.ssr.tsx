import bootstrapScriptContent from "virtual:vite-rsc/bootstrap-script-content";
import * as ReactClient from "@hiogawa/vite-rsc/ssr";
// @ts-ignore
import * as ReactDOMServer from "react-dom/server.edge";

export async function handleSsr(rscStream: ReadableStream) {
  // deserialize RSC
  // (NOTE: ssr deserization should be done inside a wrapper component, but it's simplified for doc.)
  const root = await ReactClient.createFromReadableStream(rscStream);

  // render html (traditional SSR)
  const htmlStream = ReactDOMServer.renderToReadableStream(root, {
    bootstrapScriptContent,
  });

  return htmlStream;
}
