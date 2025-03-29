import {} from "./server-init";

import { renderRequest } from "../lib/server";
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

export default async function handler(request: Request): Promise<Response> {
  const root = <Document />;
  return renderRequest(request, root);
}
