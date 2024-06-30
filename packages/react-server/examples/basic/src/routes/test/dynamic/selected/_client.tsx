"use client";

import { useSelectedLayoutSegments } from "@hiogawa/react-server/client";

export function Selected() {
  const params = useSelectedLayoutSegments();
  return <>{JSON.stringify(params)}</>;
}
