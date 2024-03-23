import { Link } from "@hiogawa/react-server/client";
import type { LayoutProps } from "@hiogawa/react-server/server";

// similar demo
// https://react.dev/reference/react/useTransition#marking-a-state-update-as-a-non-blocking-transition

const TABS = [
  ["/test/transition", "About"],
  ["/test/transition?sleep=2000", "Posts (2 sec)"],
  ["/test/transition?sleep=200", "Contact (200 msec)"],
] as const;

export default async function Layout(props: LayoutProps) {
  const url = new URL(props.request.url);
  const urlHref = url.href.slice(url.origin.length);
  return (
    <div className="border m-2 p-2 w-lg flex flex-col gap-2">
      <h4 className="font-bold">useTransition demo</h4>
      <ul className="antd-tablist flex gap-5 px-2">
        {TABS.map(([href, name]) => (
          <Link
            className="antd-tab py-1.5"
            href={href}
            aria-selected={href === urlHref}
          >
            <li key={href}>{name}</li>
          </Link>
        ))}
      </ul>
      <div className="p-2">{props.children}</div>
    </div>
  );
}
