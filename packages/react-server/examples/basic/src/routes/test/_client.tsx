"use client";

import { tinyassert } from "@hiogawa/utils";
import React from "react";

export function Hydrated() {
  return <div>[hydrated: {Number(useHydrated())}]</div>;
}

// https://tkdodo.eu/blog/avoiding-hydration-mismatches-with-use-sync-external-store#usesyncexternalstore
export function useHydrated(): boolean {
  return React.useSyncExternalStore(
    React.useState(() => () => () => {})[0],
    () => true,
    () => false,
  );
}

// test client re-rendering
// https://github.com/pmndrs/jotai/blob/419ab5cda3503e70463dc340076e21e438db89b6/tests/react/basic.test.tsx#L27-L33
export function EffectCount() {
  const elRef = React.useRef<HTMLElement>(null);
  const countRef = React.useRef(0);

  React.useEffect(() => {
    countRef.current++;
    tinyassert(elRef.current);
    elRef.current.textContent = String(countRef.current);
  });

  return (
    <div>
      [effect: <span ref={elRef}>0</span>]
    </div>
  );
}
