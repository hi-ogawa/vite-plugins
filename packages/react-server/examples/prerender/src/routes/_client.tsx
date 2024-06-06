"use client";

import React from "react";

export function Hydrated() {
  const hydrated = React.useSyncExternalStore(
    React.useCallback(() => () => {}, []),
    () => true,
    () => false,
  );
  return <span id="hydrated" data-hydrated={hydrated} />;
}
