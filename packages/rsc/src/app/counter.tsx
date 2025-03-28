"use client";

import React from "react";

export function Counter(): React.ReactElement {
  const [count, setCount] = React.useState(0);
  return <button onClick={() => setCount((c) => c + 1)}>Count: {count}</button>;
}
