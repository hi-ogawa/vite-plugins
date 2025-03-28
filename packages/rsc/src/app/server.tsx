import { renderRequest } from "../lib/server";
import { testAction } from "./action";
import { Counter } from "./counter";

function Document() {
  return (
    <html>
      <head>
        <title>vite-rsc</title>
      </head>
      <body>
        <h4>hello server</h4>
        <form action={testAction}>
          <button>TestAction</button>
        </form>
        <Counter />
      </body>
    </html>
  );
}

export default async function handler(request: Request): Promise<Response> {
  const root = <Document />;
  return renderRequest(request, root);
}
