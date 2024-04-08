"use client";

import { useRouter } from "@hiogawa/react-server/client";
import React from "react";

export function ClientLocation() {
  const location = useRouter((s) => s.location);

  React.useEffect(() => {
    0 && console.log("[ClientLocation]", location, window.location);
  }, [location]);

  return <>{location.pathname}</>;
}
