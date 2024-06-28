"use client";

import { useSelectedParams } from "@hiogawa/react-server/client";

export function SelectedParams() {
  const params = useSelectedParams({ below: true });
  return <>{JSON.stringify(params)}</>;
}
