"use client";

// TODO
// implement it in packages/react-server/src/lib/client/link.tsx?

import { routerRevalidate, useRouter } from "@hiogawa/react-server/client";

export function LinkWithRevalidate({
  revalidate,
  ...props
}: JSX.IntrinsicElements["a"] & { href: string; revalidate?: boolean }) {
  const history = useRouter((s) => s.history);

  return (
    <a
      {...props}
      onClick={(e) => {
        const target = e.currentTarget.target;
        if (
          e.button === 0 &&
          !(e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) &&
          (!target || target === "_self")
        ) {
          e.preventDefault();
          history.push(props.href!, routerRevalidate());
        }
      }}
    />
  );
}
