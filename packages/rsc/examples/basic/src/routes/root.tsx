import React from "react";
import {
  changeServerCounter,
  getServerCounter,
  resetServerCounter,
} from "./action";
import {
  TestActionFromClient,
  TestUseActionState,
} from "./action-from-client/client";
import {
  ClientCounter,
  Hydrated,
  TestPayloadClient,
  TestStyleClient,
  TestTailwindClient,
  TestTemporaryReference,
} from "./client";
import { TestStyleClient2 } from "./client2";
import ErrorBoundary from "./error-boundary";
import "./server.css";
import {
  TestServerActionBindAction,
  TestServerActionBindClient,
  TestServerActionBindReset,
  TestServerActionBindSimple,
} from "./action-bind/server";
import { TestSerializationServer } from "./serialization/server";
import styles from "./server.module.css";

export function Root(props: { url: URL }) {
  return (
    <html>
      <head>
        <title>vite-rsc</title>
        {import.meta.viteRsc.loadCss("/src/routes/root.tsx")}
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
          <button>Server Counter: {getServerCounter()}</button>
          <button formAction={resetServerCounter}>Server Reset</button>
        </form>
        <TestStyleClient />
        <div className="test-style-server">test-style-server</div>
        <div data-testid="css-module-server" className={styles.server}>
          test-css-module-server
        </div>
        <div>
          <a href="?test-client-style-no-ssr">test-client-style-no-ssr</a>{" "}
          {props.url.search.includes("test-client-style-no-ssr") && (
            <TestStyleClient2 />
          )}
        </div>
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
        <TestServerActionError />
        <TestReplayConsoleLogs url={props.url} />
        <TestSuspense url={props.url} />
        <TestActionFromClient />
        <TestUseActionState />
        <TestPayload testBinary={props.url.searchParams.has("test-binary")} />
        <TestServerActionBindReset />
        <TestServerActionBindSimple />
        <TestServerActionBindClient />
        <TestServerActionBindAction />
        <TestSerializationServer />
      </body>
    </html>
  );
}

function TestServerActionError() {
  return (
    <ErrorBoundary>
      <form
        action={async () => {
          "use server";
          throw new Error("boom!");
        }}
      >
        <button>test-findSourceMapURL</button>
      </form>
    </ErrorBoundary>
  );
}

function TestReplayConsoleLogs(props: { url: URL }) {
  if (props.url.search.includes("test-replay-console-logs")) {
    console.log("[test-replay-console-logs]");
  }
  return <a href="?test-replay-console-logs">test-replayConsoleLogs</a>;
}

function TestSuspense(props: { url: URL }) {
  if (props.url.search.includes("test-suspense")) {
    const ms = Number(props.url.searchParams.get("test-suspense")) || 1000;
    async function Inner() {
      await new Promise((resolve) => setTimeout(resolve, ms));
      return <div>suspense-resolved</div>;
    }
    return (
      <div data-testid="suspense">
        <React.Suspense fallback={<div>suspense-fallback</div>}>
          <Inner />
        </React.Suspense>
      </div>
    );
  }
  return <a href="?test-suspense=1000">test-suspense</a>;
}

function TestPayload(props: { testBinary?: boolean }) {
  return (
    <div data-testid="ssr-rsc-payload">
      test-payload:{" "}
      <TestPayloadClient
        test1={"🙂"}
        test2={"<script>throw new Error('boom')</script>"}
        // reverse to have non-utf8 binary data
        test3={
          props.testBinary ? new TextEncoder().encode("🔥").reverse() : null
        }
        test4={"&><\u2028\u2029"}
      />
    </div>
  );
}
