import * as ReactServer from "@hiogawa/vite-rsc/rsc";
import { Hono } from "hono";

const app = new Hono();

app.get("/api/rsc", () => {
  const el = (
    <div>
      <div>Hono!</div>
      <div>random: ${Math.random().toString(36).slice(2)}</div>
    </div>
  );
  const stream = ReactServer.renderToReadableStream(el);
  return new Response(stream);
});

export default app.fetch;
