"use client";

import React from "react";
import { CommonComponent } from "./common";

export function Counter() {
  const [count, setCount] = React.useState(0);

  return (
    <div className="flex flex-col items-start gap-2 p-2">
      <h3 className="font-bold">Client component</h3>
      <div className="flex items-center gap-2">
        <div>Count: {count}</div>
        <button
          className="antd-btn antd-btn-default px-2"
          onClick={() => setCount((count) => count + 1)}
        >
          -1
        </button>
        <button
          className="antd-btn antd-btn-default px-2"
          onClick={() => setCount((count) => count + 1)}
        >
          +1
        </button>
      </div>
      <div>
        <CommonComponent message="from client" />
      </div>
      <div>test-hmr-div</div>
    </div>
  );
}
