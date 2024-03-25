"use client";

import {
  Link,
  useRouter,
  useServerTransitionState,
} from "@hiogawa/react-server/client";
import { cls } from "../../../components/utils";
import { changeCounter } from "./_action";

const TABS = [
  ["/test/transition", "About"],
  ["/test/transition?sleep=2000", "Posts (2.0 sec)"],
  ["/test/transition?sleep=200", "Contact (0.2 sec)"],
] as const;

export function Tablist() {
  const { isPending } = useServerTransitionState();
  const router = useRouter();

  return (
    <ul className="antd-tablist flex gap-5 px-2">
      {TABS.map(([href, name]) => (
        <Link
          key={href}
          href={href}
          className={cls(
            "antd-tab py-1.5",
            href === router.history.location.href && isPending && "opacity-50",
          )}
          aria-selected={href === router.history.location.href}
        >
          <li key={href}>{name}</li>
        </Link>
      ))}
    </ul>
  );
}

export function Counter(props: { value: number }) {
  const { isActionPending } = useServerTransitionState();

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
