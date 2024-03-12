"use client";

import React from "react";
import { CommonComponent } from "./common";

export function Counter() {
  const [count, setCount] = React.useState(0);

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        className="antd-btn antd-btn-default px-2"
        onClick={() => setCount((count) => count + 1)}
      >
        Counter: {count}
      </button>
      <div>
        <CommonComponent message="from client" />
      </div>
      <div>test-hmr-div</div>
    </div>
  );
}
