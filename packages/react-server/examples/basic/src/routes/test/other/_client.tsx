"use client";

import { Link } from "@hiogawa/react-server/client";
import React from "react";

export function LinkInClientComponent() {
  return (
    <div>
      <Link className="antd-link" href="/">
        LinkInClientComponent
      </Link>
    </div>
  );
}

export function LinkOnClickMerge() {
  const [count, setCount] = React.useState(0);
  return (
    <div className="flex gap-1">
      <Link
        className="antd-link"
        href="/test/other?count"
        onClick={() => {
          setCount((c) => c + 1);
        }}
      >
        LinkOnClickMerge
      </Link>
      <span>Count: {count}</span>
    </div>
  );
}
