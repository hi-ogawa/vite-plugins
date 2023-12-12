import { h, renderToString } from "@hiogawa/tiny-react";
import { App } from "./app";

// TODO: invalidation on file change
console.log("@@ importing server.ts");

export default {
  async fetch(request: Request, _env: any) {
    const html = renderToString(h(App, { url: request.url }));
    const fullHtml = wrapHtml(html);
    return new Response(fullHtml, {
      headers: {
        "content-type": "text/html",
      },
    });
  },
};

// TODO: expose ViteDevServer.transformIndexHtml to workered?
const wrapHtml = (html: string) => `
<!DOCTYPE html>
<html>
  <head>
    <script src="/@vite/client" type="module"></script>
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
    <script src="/demo/client.ts" type="module"></script>
  </body>
</html>
`;
