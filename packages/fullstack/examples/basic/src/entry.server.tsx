import { renderToReadableStream } from "react-dom/server.edge";
import { App } from "./App";
import "./index.css";
import { mergeAssets } from "@hiogawa/vite-plugin-fullstack/runtime";

async function handler(_request: Request): Promise<Response> {
  const html = await renderToReadableStream(<Root />);
  return new Response(html, {
    headers: { "Content-Type": "text/html;charset=utf-8" },
  });
}

function Root() {
  const clientAssets = import.meta.vite.assets({
    import: "./entry.client.tsx",
    environment: "client",
    asEntry: true,
  });
  const serverAssets = import.meta.vite.assets();
  const assets = mergeAssets(clientAssets, serverAssets);

  return (
    <html>
      <head>
        <title>Vite Fullstack</title>
        {assets.css.map((attrs) => (
          <link key={attrs.href} {...attrs} rel="stylesheet" crossOrigin="" />
        ))}
        {assets.js.map((attrs) => (
          <link
            key={attrs.href}
            {...attrs}
            rel="modulepreload"
            crossOrigin=""
          />
        ))}
        <script type="module" src={clientAssets.entry}></script>
      </head>
      <body>
        <div id="root">
          <App />
        </div>
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
