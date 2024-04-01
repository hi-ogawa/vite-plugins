"use client";

import { useRouter } from "@hiogawa/react-server/client";
import { cls } from "../../../components/utils";
import { changeCounter } from "./_action";

export function Counter(props: { value: number }) {
  const isActionPending = useRouter((s) => s.isActionPending);

  return (
    <form action={changeCounter} className="flex flex-col items-start gap-2">
      <div className="flex items-center gap-2">
        <button
          className="antd-btn antd-btn-default px-2"
          name="delta"
          value={-1}
        >
          -1 (2.0 sec)
        </button>
        <button
          className="antd-btn antd-btn-default px-2"
          name="delta"
          value={+1}
        >
          +1 (0.2 sec)
        </button>
        <div className={cls(isActionPending && "opacity-50")}>
          Count: {props.value}
        </div>
      </div>
    </form>
  );
}
