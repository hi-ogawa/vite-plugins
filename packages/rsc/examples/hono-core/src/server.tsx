import { renderToReadableStream } from "@hiogawa/vite-rsc/react/rsc";
import { Hono } from "hono";

const app = new Hono();

app.get("/api/rsc", () => {
  const el = (
    <div>
      <div>Hono!</div>
      <div>random: ${Math.random().toString(36).slice(2)}</div>
    </div>
  );
  return renderRsc(el);
});

function renderRsc(value: unknown) {
  const stream = renderToReadableStream(value);
  return new Response(stream, {
    headers: {
      "content-type": "text/x-component;charset=utf-8",
    },
  });
}

export default app;
