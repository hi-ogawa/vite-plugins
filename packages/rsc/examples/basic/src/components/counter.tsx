"use client";

import React from "react";
import { CommonComponent } from "./common";

export function Counter(props: { defaultValue: number }) {
  const [count, setCount] = React.useState(props.defaultValue);

  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => {
    setHydrated(true);
  }, []);

  return (
    <div>
      <button onClick={() => setCount((count) => count + 1)}>
        Count: {count}
      </button>
      <div>
        <CommonComponent />
      </div>
      <div>hydrated: {String(hydrated)}</div>
      <div>test-hmr-div</div>
    </div>
  );
}
