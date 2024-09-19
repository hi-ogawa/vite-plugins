"use client";

import React from "react";

export function ClientCounter() {
  const [count, setCount] = React.useState(0);

  return (
    <div>
      <p>Client Counter: {count}</p>
      <button onClick={() => setCount(count - 1)}>-1</button>
      <button onClick={() => setCount(count + 1)}>+1</button>
    </div>
  );
}
