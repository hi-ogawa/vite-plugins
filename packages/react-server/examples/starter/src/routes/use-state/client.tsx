"use client";

import React from "react";

export function Counter() {
  const [value, setValue] = React.useState(0);

  return (
    <div>
      <span>Count: {value}</span>
      <div>
        <button onClick={() => setValue((v) => v - 1)}>-1</button>
        <button onClick={() => setValue((v) => v + 1)}>+1</button>
      </div>
    </div>
  );
}
