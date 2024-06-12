"use client";

import React from "react";

export function Postpone() {
  // @ts-expect-error
  React.unstable_postpone("testing postpone");
  return null;
}
