"use client";

import React from "react";

export function Counter() {
  const [count, setCount] = React.useState(0);

  return (
    <div>
      <button onClick={() => setCount((count) => count + 1)}>
        count is {count}
      </button>
    </div>
  );
}
