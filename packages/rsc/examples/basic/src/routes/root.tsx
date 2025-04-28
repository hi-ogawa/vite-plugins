import type React from "react";
import {
  changeServerCounter,
  resetServerCounter,
  serverCounter,
  testServerActionError,
} from "./action";
import {
  ClientCounter,
  Hydrated,
  TestStyleClient,
  TestTailwindClient,
  TestTemporaryReference,
} from "./counter";
import ErrorBoundary from "./error-boundary";

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
        <TestTemporaryReference
          action={async (node: React.ReactNode) => {
            "use server";
            return (
              <span>
                [server <span>{node}</span>]
              </span>
            );
          }}
        />
        <ErrorBoundary>
          {/* TODO: not working for inline server action? */}
          <form action={testServerActionError}>
            <button>test-findSourceMapURL</button>
          </form>
        </ErrorBoundary>
      </body>
    </html>
  );
}
