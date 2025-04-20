"use client";

import React from "react";

export function TestHydrated() {
  const hydrated = React.useSyncExternalStore(
    React.useCallback(() => () => {}, []),
    () => true,
    () => false,
  );
  return <div data-testid="hydrated">[hydrated: {hydrated ? 1 : 0}]</div>;
}

export function TestClientState() {
  return (
    <div>
      <input data-testid="client-state" placeholder="client-state" />
    </div>
  );
}
