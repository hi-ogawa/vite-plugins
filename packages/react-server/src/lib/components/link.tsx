"use client";

import { useRouter } from "../client/router";

// TODO: study prior art
// https://github.com/TanStack/router/blame/a1030ef24de104eb32f7a781cda247458e0ec90a/packages/react-router/src/link.tsx
// https://github.com/remix-run/react-router/blob/9e7486b89e712b765d947297f228650cdc0c488e/packages/react-router-dom/index.tsx#L1394

export function Link(props: JSX.IntrinsicElements["a"] & { href: string }) {
  const router = useRouter();
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
          router.history.push(props.href!);
        }
      }}
    />
  );
}
