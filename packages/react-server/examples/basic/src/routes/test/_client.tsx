"use client";

import React from "react";

export function Hydrated() {
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => {
    setHydrated(true);
  }, []);

  return <div>[hydrated: {String(hydrated)}]</div>;
}

// test client re-rendering
// https://github.com/pmndrs/jotai/blob/419ab5cda3503e70463dc340076e21e438db89b6/tests/react/basic.test.tsx#L27-L33
export function EffectCount() {
  const commitCountRef = React.useRef(1);
  React.useEffect(() => {
    commitCountRef.current += 1;
  });
  return <div>[EffectCount: {commitCountRef.current}]</div>;
}
