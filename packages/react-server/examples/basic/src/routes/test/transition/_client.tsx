"use client";

import { Link, useRouter } from "@hiogawa/react-server/client";
import { cls } from "../../../components/utils";

const TABS = [
  ["/test/transition", "About"],
  ["/test/transition?sleep=2000", "Posts (2.0 sec)"],
  ["/test/transition?sleep=200", "Contact (0.2 sec)"],
] as const;

export function Tablist() {
  const isPending = useRouter((s) => s.isPending);
  const location = useRouter((s) => s.location);

  return (
    <ul className="antd-tablist flex gap-5 px-2">
      {TABS.map(([href, name]) => (
        <Link
          key={href}
          href={href}
          className={cls(
            "antd-tab py-1.5",
            href === location.href && isPending && "opacity-50",
          )}
          aria-selected={href === location.href}
        >
          <li key={href}>{name}</li>
        </Link>
      ))}
    </ul>
  );
}
