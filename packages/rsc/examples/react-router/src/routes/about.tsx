"use client";

import React from "react";

export default function About() {
  const [count, setCount] = React.useState(0);

  return (
    <main>
      <h1>About</h1>
      <p>This is the about page.</p>
      <button onClick={() => setCount((c) => c + 1)}>
        Client counter: {count}
      </button>
      <Hydrated />
    </main>
  );
}

export function Hydrated() {
  const hydrated = React.useSyncExternalStore(
    React.useCallback(() => () => {}, []),
    () => true,
    () => false,
  );
  return <div data-testid="hydrated">[hydrated: {hydrated ? 1 : 0}]</div>;
}
