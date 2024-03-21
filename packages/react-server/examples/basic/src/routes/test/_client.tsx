"use client";

import React from "react";

export function Hydrated() {
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => {
    setHydrated(true);
  }, []);

  return <div>hydrated: {String(hydrated)}</div>;
}
