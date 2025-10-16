import { renderToReadableStream } from "react-dom/server.edge";
import { App } from "./App";
import "./index.css";
import clientAssets from "./entry.client.tsx?assets=client";
import serverAssets from "./entry.server.tsx?assets=ssr";

async function handler(_request: Request): Promise<Response> {
  const html = await renderToReadableStream(<Root />);
  return new Response(html, {
    headers: { "Content-Type": "text/html;charset=utf-8" },
  });
}

function Root() {
  const assets = clientAssets.merge(serverAssets);

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
        <script type="module" src={assets.entry}></script>
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
