import assetsManifest from "virtual:assets-manifest";
import { renderToString } from "react-dom/server";

export default async function handler(_request: Request): Promise<Response> {
  const html = renderToString(<Root />);
  return new Response(html, {
    headers: { "Content-Type": "text/html" },
  });
}

function Root() {
  assetsManifest.entry;
  return (
    <html>
      <head>
        <title>Vite SSR</title>
        <script type="module" src={assetsManifest.entry} />
      </head>
      <body>
        <div>SSR at {new Date().toISOString()}</div>
        <div id="client-app"></div>
      </body>
    </html>
  );
}

if (import.meta.hot) {
  import.meta.hot.accept();
}
