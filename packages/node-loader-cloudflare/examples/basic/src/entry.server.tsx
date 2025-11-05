import { env } from "cloudflare:workers";
import { Hono } from "hono";
import clientAssets from "./client/main?assets=client";

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

class Counter {
  static async get() {
    const count = Number(env.KV.get("count") || 0);
    return count;
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

if (import.meta.hot) {
  import.meta.hot.accept();
}
