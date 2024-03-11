"use client";

import React from "react";
import { CommonComponent } from "./common";

export function Counter() {
  const [count, setCount] = React.useState(0);

  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => {
    setHydrated(true);
  }, []);

  return (
    <div>
      <button
        className="antd-btn antd-btn-default px-2"
        onClick={() => setCount((count) => count + 1)}
      >
        Count: {count}
      </button>
      <div>
        <CommonComponent message="from client" />
      </div>
      <div>hydrated: {String(hydrated)}</div>
      <div>test-hmr-div</div>
    </div>
  );
}
