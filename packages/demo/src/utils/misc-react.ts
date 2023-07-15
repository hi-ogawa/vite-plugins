import React from "react";

// workaround StrictMode double effect
export function useEffectNoStrict(
  ...[fn, deps]: Parameters<typeof React.useEffect>
) {
  let skip = true;
  React.useEffect(() => {
    if (skip) {
      skip = false;
      return;
    }
    return fn();
  }, deps);
}
