"use client";

import React from "react";

export function TestClient() {
  const [count, setCount] = React.useState(0);

  return (
    <button
      className="text-blue-500 p-2 px-3 min-w-sm rounded-xl border flex items-center hover:shadow"
      onClick={() => setCount(count + 1)}
    >
      Test Client: {count}
    </button>
  );
}
