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
  // Impot client entry assets on server.
  // It doesn't support dynamically adding build entry,
  // so `build.rollupOption.input` still needs to be manually written.
  // This will include client js entry and its dependencies.
  // > { entry: string, js: { href: string, ... }[], css: { href: string, ... }[] }
  const clientAssets = import.meta.vite.assets({
    import: "./entry.client.tsx",
    environment: "client",
  });

  // By default, `import` and `environment` are inferred as
  // current module and current environment, which in this case is,
  // > { import: "./entry.server.tsx", environment: "ssr" }
  // This will include only server css assets.
  // > { css: { href: string, ... }[] }
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
