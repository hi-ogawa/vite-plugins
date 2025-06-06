import { changeServerCounter, serverCounter } from "./action";
import { ClientCounter, Hydrated } from "./client";

export function Root() {
  return (
    <html>
      <head>
        <title>vite-rsc</title>
      </head>
      <body className="flex flex-col gap-2 items-start p-2">
        <h4 className="text-xl">Test</h4>
        <div>
          <Hydrated />
        </div>
        <ClientCounter />
        <ServerCounter />
      </body>
    </html>
  );
}

function ServerCounter() {
  return (
    <form action={changeServerCounter.bind(null, 1)}>
      <button>Server Counter: {serverCounter}</button>
    </form>
  );
}
