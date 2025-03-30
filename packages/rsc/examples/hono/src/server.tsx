import { renderRequest } from "@hiogawa/vite-rsc/server";
import { Hono } from "hono";
import { changeServerCounter, serverCounter } from "./action";
import { ClientCounter, FetchRsc } from "./counter";

function Document() {
  return (
    <html>
      <head>
        <title>vite-rsc</title>
      </head>
      <body>
        <h4>hello server</h4>
        <form action={changeServerCounter}>
          <input type="hidden" name="change" value="1" />
          <button>Server Counter: {serverCounter}</button>
        </form>
        <ClientCounter />
        <FetchRsc />
      </body>
    </html>
  );
}

const app = new Hono();

app.get("/api/hono", (c) => c.text("Hono!"));

app.get("/api/rsc", (c) => {
  const el = (
    <div>
      <div>Hono!</div>
      <div>random: ${Math.random().toString(36).slice(2)}</div>
    </div>
  );
  return renderRequest(c.req.raw, el);
});

app.all("/", (c) => {
  const el = <Document />;
  return renderRequest(c.req.raw, el);
});

export default app.fetch;
