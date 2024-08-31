"use client";

import React from "react";

export function TestClient() {
  const [count, setCount] = React.useState(0);

  return (
    <button
      className="p-2 text-blue-500 rounded-xl border flex items-center hover:shadow"
      onClick={() => setCount(count + 1)}
    >
      Test Client: {count}
    </button>
  );
}
