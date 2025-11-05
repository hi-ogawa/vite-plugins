import { env } from "cloudflare:workers";
import { Hono } from "hono";
import clientAssets from "./client/main?assets=client";
import stylesUrl from "./styles.css?url";

const app = new Hono();
export default app;

app.get("/", async (c) => {
  return c.html(<Root />);
});

function Root() {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Vite + Cloudflare Workers Demo</title>
        <meta
          name="description"
          content="Full-stack demo application built with Vite and Cloudflare Workers"
        />
        <script type="module" src={clientAssets.entry} />
        <link rel="stylesheet" href={stylesUrl} />
      </head>
      <body>
        <div id="client-app"></div>
      </body>
    </html>
  );
}

class Counter {
  static async get() {
    const raw = await env.KV.get("count");
    const count = Number(raw || 0);
    return Number.isSafeInteger(count) ? count : 0;
  }
  static async change(delta: number) {
    const count = await this.get();
    const newCount = count + delta;
    await env.KV.put("count", String(newCount));
    return newCount;
  }
}

app.get("/count", async (c) => {
  return c.json({ count: await Counter.get() });
});

app.post("/count", async (c) => {
  const { change } = await c.req.json();
  return c.json({ count: await Counter.change(change) });
});

app.notFound((c) => {
  return c.text("404 Not Found", 404);
});

if (import.meta.hot) {
  import.meta.hot.accept();
}
