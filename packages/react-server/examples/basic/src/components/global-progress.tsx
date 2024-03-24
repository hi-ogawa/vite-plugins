"use client";

import { ServerTransitionContext } from "@hiogawa/react-server/client";
import React from "react";

export function GlobalProgress() {
  const ctx = React.useContext(ServerTransitionContext);

  return (
    <>
      {ctx.isPending && (
        <div className="antd-spin w-5 h-5 text-colorInfo"></div>
      )}
      {ctx.isActionPending && (
        <div className="antd-spin w-5 h-5 text-colorWarning"></div>
      )}
    </>
  );
}
