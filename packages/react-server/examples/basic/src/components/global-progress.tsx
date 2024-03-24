"use client";

import { useServerTransitionState } from "@hiogawa/react-server/client";

export function GlobalProgress() {
  const ctx = useServerTransitionState();

  // TODO: animate in/out
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
