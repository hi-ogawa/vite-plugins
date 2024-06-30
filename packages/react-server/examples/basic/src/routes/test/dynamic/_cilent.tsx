"use client";

import { useLocation, useRouter } from "@hiogawa/react-server/client";

export function ClientLocation() {
  const location = useRouter((s) => s.location);
  return <>{location.pathname}</>;
}

export function ServerLocation() {
  const location = useLocation();
  return <>{location.pathname}</>;
}
