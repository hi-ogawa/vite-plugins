import type http from "node:http";
import { renderToString } from "react-dom/server";
import type { ViteDevServer } from "vite";
import { App } from "./app";

export default async function handler(
  req: http.IncomingMessage & { viteDevServer: ViteDevServer },
  res: http.ServerResponse
) {
  let html = INDEX_HTML;
  html = await req.viteDevServer.transformIndexHtml("/", html);

  const ssrHtml = renderToString(<App />);
  html = html.replace("<!--@INJECT_SSR@-->", ssrHtml);

  res.setHeader("content-type", "text/html").end(html);
}

const INDEX_HTML = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>vite-node-miniflare-demo</title>
    <meta name="viewport" content="width=device-width, height=device-height, initial-scale=1.0"/>
  </head>
  <body>
    <div id="root"><!--@INJECT_SSR@--></div>
    <script src="./src/entry-client.tsx" type="module"></script>
  </body>
</html>
`;
