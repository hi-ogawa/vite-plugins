"use client";

import React from "react";

export function Postpone(props: React.PropsWithChildren) {
  if (globalThis.process?.env["__renderMode"] === "prerender") {
    // @ts-expect-error
    React.unstable_postpone();
  }
  return <>{props.children}</>;
}
