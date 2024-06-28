"use client";

import { useSelectedParams } from "@hiogawa/react-server/client";

export function SelectedParams() {
  const params = useSelectedParams();
  return <>{JSON.stringify(params)}</>;
}
