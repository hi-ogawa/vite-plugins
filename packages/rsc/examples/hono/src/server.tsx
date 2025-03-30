import { renderRequest } from "@hiogawa/vite-rsc/server";
import { Hono } from "hono";
import React from "react";

const app = new Hono();

app.get("/api/rsc", (c) => {
  const el = (
    <div>
      <div>Hono!</div>
      <div>random: ${Math.random().toString(36).slice(2)}</div>
      <React.Suspense></React.Suspense>
    </div>
  );
  // TODO: renderRsc to just stream rsc
  return renderRequest(c.req.raw, el);
});

app.all("/", (c) => {
  return renderRequest(c.req.raw, <Document />);
});

function Document() {
  return (
    <html>
      <head>
        <title>vite-rsc</title>
      </head>
      <body>
        <div id="root"></div>
      </body>
    </html>
  );
}

export default app.fetch;
