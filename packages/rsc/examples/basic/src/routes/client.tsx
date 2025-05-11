"use client";

import React from "react";
import "./client.css";

export function ClientCounter(): React.ReactElement {
  const [count, setCount] = React.useState(0);
  return (
    <button onClick={() => setCount((c) => c + 1)}>
      Client Counter: {count}
    </button>
  );
}

export function Hydrated() {
  const hydrated = React.useSyncExternalStore(
    React.useCallback(() => () => {}, []),
    () => true,
    () => false,
  );
  return <span data-testid="hydrated">[hydrated: {hydrated ? 1 : 0}]</span>;
}

export function TestStyleClient() {
  return <div className="test-style-client">test-style-client</div>;
}

export function TestTailwindClient() {
  return <div className="test-tw-client text-blue-500">test-tw-client</div>;
}

export function TestTemporaryReference(props: {
  action: (node: React.ReactNode) => Promise<React.ReactNode>;
}) {
  const [result, setResult] = React.useState<React.ReactNode>("(none)");

  return (
    <div className="flex">
      <form
        action={async () => {
          setResult(await props.action(<span>[client]</span>));
        }}
      >
        <button>test-temporary-reference</button>
      </form>
      <div data-testid="temporary-reference">result: {result}</div>
    </div>
  );
}

export function UnusedClientReference() {
  console.log("__unused_client_reference__");
}
