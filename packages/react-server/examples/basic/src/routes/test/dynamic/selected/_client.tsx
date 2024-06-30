"use client";

import { useSelectedLayoutSegments } from "@hiogawa/react-server/client";

export function SelectedParams() {
  const params = useSelectedLayoutSegments();
  return <>{JSON.stringify(params)}</>;
}
