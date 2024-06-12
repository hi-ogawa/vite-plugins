import type { LayoutProps } from "@hiogawa/react-server/server";
import React from "react";

export default function Layout(props: LayoutProps) {
  return (
    <div>
      <h4>PPR</h4>
      <React.Suspense fallback={<div>Loading...</div>}>
        {props.children}
      </React.Suspense>
    </div>
  );
}
