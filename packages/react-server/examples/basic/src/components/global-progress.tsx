"use client";

import { useServerTransitionState } from "@hiogawa/react-server/client";
import { cls } from "./utils";

export function GlobalProgress() {
  const ctx = useServerTransitionState();

  return (
    <>
      <div
        className={cls(
          "antd-spin w-5 h-5 text-colorInfo transition duration-500",
          ctx.isPending ? "opacity-100" : "opacity-0",
        )}
      ></div>
      <div
        className={cls(
          "antd-spin w-5 h-5 text-colorWarning transition duration-500",
          ctx.isActionPending ? "opacity-100" : "opacity-0",
        )}
      ></div>
    </>
  );
}
