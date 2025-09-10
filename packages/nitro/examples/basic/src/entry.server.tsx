import { renderToString } from "react-dom/server";

export default async function handler(_request: Request): Promise<Response> {
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
        {import.meta.env.DEV && (
          <script type="module" src="/src/entry.client.tsx" />
        )}
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
