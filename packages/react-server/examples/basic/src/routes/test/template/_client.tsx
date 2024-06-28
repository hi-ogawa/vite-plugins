"use client";

import React from "react";

export function ClientTime() {
  const now = React.useSyncExternalStore(
    React.useCallback(() => () => {}, []),
    () => Date.now(),
    () => null,
  );
  return <>[now: {now}]</>;
}
