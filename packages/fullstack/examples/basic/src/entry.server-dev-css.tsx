import { renderToReadableStream } from "react-dom/server.edge";
import { App } from "./App";
import "./index.css";
import clientAssets from "./entry.client.tsx?assets=client";
// @ts-ignore - virtual module
import devServerCss from "virtual:dev-server-css";

async function handler(_request: Request): Promise<Response> {
  const html = await renderToReadableStream(<Root />);
  return new Response(html, {
    headers: { "Content-Type": "text/html;charset=utf-8" },
  });
}

function Root() {
  return (
    <html>
      <head>
        <title>Vite Fullstack - Dev Server CSS</title>
        {devServerCss.map((attrs: any) => (
          <link key={attrs.href} {...attrs} rel="stylesheet" crossOrigin="" />
        ))}
        {clientAssets.js.map((attrs) => (
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
