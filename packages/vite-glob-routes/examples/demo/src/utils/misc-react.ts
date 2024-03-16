import { once } from "@hiogawa/utils";
import React from "react";

// workaround StrictMode double effect
export function useEffectNoStrict(...args: Parameters<typeof React.useEffect>) {
  return React.useEffect(once(args[0]), args[1]);
}
