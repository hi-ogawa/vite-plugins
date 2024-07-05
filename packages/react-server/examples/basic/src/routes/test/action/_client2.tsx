"use client";

import React from "react";

export function TestClientComponent() {
  const [count, setCount] = React.useState(0);
  return (
    <button
      className="antd-btn antd-btn-default px-2"
      onClick={() => setCount((c) => c + 1)}
    >
      [client] counter: {count}
    </button>
  );
}
