import "./styles/server.css";
import { renderToReadableStream } from "react-dom/server.edge";

async function handler(_request: Request): Promise<Response> {
  const html = await renderToReadableStream(<Root />);
  return new Response(html, {
    headers: { "Content-Type": "text/html;charset=utf-8" },
  });
}

function Root() {
  const assets = import.meta.vite.assets({
    import: "/src/entry.client.tsx",
    environment: "client",
  });

  // by default, `import` and `environment` are treated as
  // current module and current environment, which in this case is,
  // { import: "./entry.server.tsx", environment: "ssr" }
  const serverAssets = import.meta.vite.assets();

  console.log({ assets, serverAssets });

  return (
    <html>
      <head>
        <title>Vite Fullstack</title>
        {[...assets.css, ...serverAssets.css].map((attrs) => (
          <link key={attrs.href} {...attrs} rel="stylesheet" crossOrigin="" />
        ))}
        {[...assets.js, ...serverAssets.js].map((attrs) => (
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
        <div>SSR at {new Date().toISOString()}</div>
        <div className="test-server-style">test-server-style</div>
        <div id="client-app"></div>
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
