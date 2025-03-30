import { renderRequest } from "@hiogawa/vite-rsc/server";
import { changeServerCounter, serverCounter } from "./action";
import { ClientCounter } from "./counter";

function Document() {
  return (
    <html>
      <head>
        <title>vite-rsc</title>
      </head>
      <body>
        <h4>server</h4>
        <form action={changeServerCounter}>
          <input type="hidden" name="change" value="1" />
          <button>Server Counter: {serverCounter}</button>
        </form>
        <ClientCounter />
        <div className="test-css">test-css</div>
        {/*
          // expose API as virtual (separate plugin)?
          // await import("virtual:collect-css/src/styles.css")
          // await import("virtual:collect-css/src/styles.css?recurse")
        */}
        <link rel="stylesheet" href="/src/styles.css" precedence="high" />
      </body>
    </html>
  );
}

export default async function handler(request: Request): Promise<Response> {
  const root = <Document />;
  return renderRequest(request, root);
}
