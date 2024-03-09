"use client";

import React from "react";
import { CounterInner } from "./counter-inner";

export function Counter(props: { defaultValue: number }) {
  const [count, setCount] = React.useState(props.defaultValue);

  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => {
    setHydrated(true);
  }, []);

  return (
    <div>
      <button onClick={() => setCount((count) => count + 1)}>
        count is {count}
      </button>
      <div>
        <CounterInner />
      </div>
      <div>hydrated: {String(hydrated)}</div>
    </div>
  );
}
