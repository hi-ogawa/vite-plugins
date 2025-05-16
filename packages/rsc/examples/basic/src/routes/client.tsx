"use client";

import React from "react";
import "./client.css";
import styles from "./client.module.css";

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
  return (
    <>
      <div className="test-style-client">test-style-client</div>
      <div data-testid="css-module-client" className={styles.client}>
        test-css-module-client
      </div>
    </>
  );
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

export function TestPayloadClient(props: {
  test1?: any;
  test2?: any;
  test3?: any;
  test4?: any;
}) {
  const results = {
    test1: props.test1 === "🙂",
    test2: props.test2 === "<script>throw new Error('boom')</script>",
    test3:
      props.test3 instanceof Uint8Array &&
      isSameArray(props.test3, new TextEncoder().encode("🔥").reverse()),
    test4: props.test4 === "&><\u2028\u2029",
  };
  const formatted = Object.entries(results)
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join(", ");
  return <>{formatted}</>;
}

function isSameArray(x: Uint8Array, y: Uint8Array) {
  if (x.length !== y.length) return false;
  for (let i = 0; i < x.length; i++) {
    if (x[i] !== y[i]) return false;
  }
  return true;
}
