"use client";

import { useRouter } from "@hiogawa/react-server/client";

export function ClientLocation() {
  const location = useRouter((s) => s.location);
  return <>{location.pathname}</>;
}
