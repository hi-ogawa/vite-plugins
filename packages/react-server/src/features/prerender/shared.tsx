import React from "react";

export function Postpone(props: React.PropsWithChildren) {
  // TODO: add to $__global
  if (globalThis.process?.env?.["REACT_SERVER_RENDER_MODE"] === "ppr") {
    // @ts-expect-error
    React.unstable_postpone();
  }
  return props.children;
}
