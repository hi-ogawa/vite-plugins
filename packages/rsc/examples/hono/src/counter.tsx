"use client";

// import { fetchRSC } from "@hiogawa/vite-rsc/browser";
import React from "react";

export function ClientCounter(): React.ReactElement {
  const [count, setCount] = React.useState(0);
  return (
    <button onClick={() => setCount((c) => c + 1)}>
      Client Counter: {count}
    </button>
  );
}

export function FetchRsc() {
  const [rsc, setRsc] = React.useState<React.ReactNode>(null);

  return (
    <div>
      <button
        onClick={async () => {
          const { fetchRSC } = await import("@hiogawa/vite-rsc/browser");
          const result = await fetchRSC("/api/rsc?__rsc");
          setRsc(result.root);
        }}
      >
        fetchRsc
      </button>
      {rsc}
    </div>
  );
}
