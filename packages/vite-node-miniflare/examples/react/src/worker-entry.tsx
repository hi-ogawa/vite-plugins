import type { ViteNodeMiniflareClient } from "@hiogawa/vite-node-miniflare/client/vite-node";
import ReactDomServer from "react-dom/server";
import { App } from "./app";

export default {
  async fetch(request: Request, env: any) {
    const ssrHtml = ReactDomServer.renderToString(<App url={request.url} />);
    let fullHtml = wrapHtml(ssrHtml);
    if (env.__VITE_NODE_MINIFLARE_CLIENT) {
      // TODO: run transformIndexHtml on template https://github.com/vitejs/vite/pull/15345#issuecomment-1855550194
      const client: ViteNodeMiniflareClient = env.__VITE_NODE_MINIFLARE_CLIENT;
      fullHtml = await client.rpc.transformIndexHtml("/", fullHtml);
    }
    return new Response(fullHtml, {
      headers: {
        "content-type": "text/html",
      },
    });
  },
};

const wrapHtml = (html: string) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>vite-node-miniflare-demo</title>
    <meta
      name="viewport"
      content="width=device-width, height=device-height, initial-scale=1.0"
    />
    <link
      rel="icon"
      type="image/svg+xml"
      href="https://iconify-dark-hiro18181.vercel.app/icon/ri/code-s-slash-line"
    />
  </head>
  <body>
    <div id="root">${html}</div>
    <script src="./src/client.tsx" type="module"></script>
  </body>
</html>
`;
