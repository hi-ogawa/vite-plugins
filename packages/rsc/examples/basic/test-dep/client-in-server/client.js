"use client";

import React from "react";

export default function TestClient() {
  const hydrated = useHydrated();
  return React.createElement("span", null, String(hydrated));
}

const noop = () => {};

function useHydrated() {
  return React.useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}
