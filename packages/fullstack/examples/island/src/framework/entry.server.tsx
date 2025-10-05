import { mergeAssets } from "@hiogawa/vite-plugin-fullstack/runtime";
import { renderToStringAsync } from "preact-render-to-string";
import IndexPage from "../routes";
import clientAssets from "./entry.client.tsx?assets=client";
import serverAssets from "./entry.server.tsx?assets=ssr";

async function handler(_request: Request): Promise<Response> {
  const html = await renderToStringAsync(<Root />);
  return new Response(html, {
    headers: { "Content-Type": "text/html;charset=utf-8" },
  });
}

function Root() {
  const assets = mergeAssets(clientAssets, serverAssets);

  return (
    <html>
      <head>
        <title>Vite Fullstack</title>
        {assets.css.map((attrs) => (
          <link
            key={attrs.href}
            {...attrs}
            rel="stylesheet"
            crossOrigin="anonymous"
          />
        ))}
        {assets.js.map((attrs) => (
          <link
            key={attrs.href}
            {...attrs}
            rel="modulepreload"
            crossOrigin="anonymous"
          />
        ))}
        <script type="module" src={clientAssets.entry}></script>
      </head>
      <body>
        <IndexPage />
      </body>
    </html>
  );
}

export default {
  fetch: handler,
};

if (import.meta.hot) {
  import.meta.hot.accept();
}
