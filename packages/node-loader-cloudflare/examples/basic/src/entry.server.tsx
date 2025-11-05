import { renderToString } from "react-dom/server";
import clientAssets from "./entry.client?assets=client";

async function handler(_request: Request): Promise<Response> {
  const html = renderToString(<Root />);
  return new Response(html, {
    headers: { "Content-Type": "text/html" },
  });
}

function Root() {
  return (
    <html>
      <head>
        <title>Vite SSR</title>
        <script type="module" src={clientAssets.entry} />
      </head>
      <body>
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
