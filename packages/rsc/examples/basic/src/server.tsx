import { renderRequest } from "@hiogawa/vite-rsc/extra/rsc";
import {
  changeServerCounter,
  resetServerCounter,
  serverCounter,
} from "./action";
import {
  ClientCounter,
  Hydrated,
  TestStyleClient,
  TestTailwindClient,
} from "./counter";

function Document() {
  return (
    <html>
      <head>
        <title>vite-rsc</title>
      </head>
      <body className="flex flex-col gap-2 items-start p-2">
        <h4 className="text-xl">Test</h4>
        <div>
          <Hydrated />
          <input data-testid="client-state" placeholder="client-state" />
        </div>
        <ClientCounter />
        <form action={changeServerCounter}>
          <input type="hidden" name="change" value="1" />
          <button>Server Counter: {serverCounter}</button>
          <button formAction={resetServerCounter}>Server Reset</button>
        </form>
        <TestStyleClient />
        <div className="test-style-server">test-style-server</div>
        <TestTailwindClient />
        <div className="test-tw-server text-red-500">test-tw-server</div>
      </body>
    </html>
  );
}

export default async function handler(request: Request): Promise<Response> {
  const root = <Document />;
  return renderRequest(request, root);
}
