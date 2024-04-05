"use client";

import type { LayoutProps } from "@hiogawa/react-server/server";

export default function Layout(props: LayoutProps) {
  return (
    <div className="flex flex-col gap-2 border p-2">
      <h4 className="font-bold">"use client" layout</h4>
      <div>{props.children}</div>
    </div>
  );
}
