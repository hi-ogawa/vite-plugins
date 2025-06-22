"use client";

import React from "react";

export default function TestClient() {
  const hydrated = useHydrated();
  return React.createElement(
    "span",
    { "data-testid": "client-in-server" },
    `[test-client-in-server: ${String(hydrated)}]`,
  );
}

const noop = () => {};

function useHydrated() {
  return React.useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}
