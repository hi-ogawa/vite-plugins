import { Hono } from "hono";
import clientAssets from "./entry.client?assets=client";

const app = new Hono();
export default app;

app.get("*", async (c) => {
  return c.html(<Root />);
});

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

if (import.meta.hot) {
  import.meta.hot.accept();
}
