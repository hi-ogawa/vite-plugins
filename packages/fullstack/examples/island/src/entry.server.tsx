import "./styles/server.css";
import { mergeAssets } from "@hiogawa/vite-plugin-fullstack/runtime";
import { renderToReadableStream } from "react-dom/server.edge";
import clientAssets from "./entry.client.tsx?assets=client";
import serverAssets from "./entry.client.tsx?assets=ssr";

async function handler(_request: Request): Promise<Response> {
  const html = await renderToReadableStream(<Root />);
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
        <div style={{ border: "2px solid lightseagreen", padding: "1rem" }}>
          <h4>Server only shell</h4>
          <div>SSR at {new Date().toISOString()}</div>
          <div className="test-server-style">test-server-style</div>
          <div id="client-app"></div>
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
