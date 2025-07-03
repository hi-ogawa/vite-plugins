"use client";

import React from "react";

export function ClientCounter(): React.ReactElement {
  const [count, setCount] = React.useState(0);
  return (
    <button onClick={() => setCount((c) => c + 1)}>
      client-counter: {count}
    </button>
  );
}

const noop = () => () => {};
export function Hydrated() {
  const hydrated = React.useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
  return <span data-testid="hydrated">[hydrated: {hydrated ? 1 : 0}]</span>;
}

export function TestTailwindClient() {
  return <div className="test-tw-client text-[#00f]">test-tw-client</div>;
}

export function UnusedClientReference() {
  console.log("__unused_client_reference__");
}
