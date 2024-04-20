"use client";

import { useRouter } from "@hiogawa/react-server/client";
import { cls } from "./utils";

export function GlobalProgress() {
  const isPending = useRouter((s) => s.isPending);
  const isActionPending = useRouter((s) => s.isActionPending);

  return (
    <>
      <div
        className={cls(
          "antd-spin w-5 h-5 text-colorInfo transition duration-500",
          isPending ? "opacity-100" : "opacity-0",
        )}
      ></div>
      <div
        className={cls(
          "antd-spin w-5 h-5 text-colorWarning transition duration-500",
          isActionPending ? "opacity-100" : "opacity-0",
        )}
      ></div>
      <div
        data-testid="transition"
        data-test-transition={JSON.stringify({ isPending, isActionPending })}
      />
    </>
  );
}
