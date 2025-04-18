import { renderRequest } from "@hiogawa/vite-rsc/server";
import {
  changeServerCounter,
  resetServerCounter,
  serverCounter,
} from "./action";
import { ClientCounter, Hydrated } from "./counter";

function Document() {
  return (
    <html>
      <head>
        <title>vite-rsc</title>
      </head>
      <body>
        <h4>Test</h4>
        <Hydrated />
        <ClientCounter />
        <form action={changeServerCounter}>
          <input type="hidden" name="change" value="1" />
          <button>Server Counter: {serverCounter}</button>
          <button formAction={resetServerCounter}>Server Reset</button>
        </form>
      </body>
    </html>
  );
}

export default async function handler(request: Request): Promise<Response> {
  const root = <Document />;
  return renderRequest(request, root);
}
