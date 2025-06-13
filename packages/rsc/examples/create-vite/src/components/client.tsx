"use client";

import React from "react";

export function Hydrated() {
  const hydrated = React.useSyncExternalStore(
    React.useCallback(() => () => {}, []),
    () => true,
    () => false,
  );

  const [count, setCount] = React.useState(0);

  return (
    <div>
      <div>hydrated: {String(hydrated)}</div>
      <button onClick={() => setCount((c) => c + 1)}>Counter {count}</button>
    </div>
  );
}
