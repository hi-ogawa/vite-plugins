import { renderRequest } from "@hiogawa/vite-rsc/server";
import { Hono } from "hono";
import { changeServerCounter, serverCounter } from "./action";
import { ClientCounter } from "./counter";

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
      </body>
    </html>
  );
}

const app = new Hono();

app.get("/api/hono", (c) => c.text("Hono!"));

app.all("/", (c) => {
  const root = <Document />;
  return renderRequest(c.req.raw, root);
});

export default app.fetch;
