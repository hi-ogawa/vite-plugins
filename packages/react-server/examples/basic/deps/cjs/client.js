"use client";

import React from "react";
import dep from "./client-dep.cjs";

export function TestClient() {
  return React.createElement("span", null, useHydrated() ? dep.test : "[...]");
}

function useHydrated() {
  return React.useSyncExternalStore(
    React.useCallback(() => () => {}, []),
    () => true,
    () => false,
  );
}
