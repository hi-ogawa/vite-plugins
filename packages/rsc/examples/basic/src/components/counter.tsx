"use client";

import React from "react";
import { CounterInner } from "./counter-inner";

// @hmr-unsafe
export function Counter(props: { defaultValue: number }) {
  const [count, setCount] = React.useState(props.defaultValue);

  return (
    <div>
      <button onClick={() => setCount((count) => count + 1)}>
        count is {count}
      </button>
      <div>
        <CounterInner />
      </div>
    </div>
  );
}
