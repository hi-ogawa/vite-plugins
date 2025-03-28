import { renderRequest } from "../lib/server";
import { Counter } from "./counter";

function Document() {
  return (
    <html>
      <head>
        <title>vite-rsc</title>
      </head>
      <body>
        <h4>hello server</h4>
        {/* <Counter /> */}
      </body>
    </html>
  );
}

export default async function handler(request: Request): Promise<Response> {
  const root = <Document />;
  return renderRequest(request, root);
}
