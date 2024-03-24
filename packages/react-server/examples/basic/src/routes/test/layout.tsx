import type { LayoutProps } from "@hiogawa/react-server/server";
import { NavMenu } from "../../components/nav-menu";
import { Hydrated } from "./_client";

export default async function Layout(props: LayoutProps) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-lg">Test</h2>
      <NavMenu
        className="grid grid-cols-3 w-lg gap-1"
        links={[
          "/test",
          "/test/other",
          "/test/action",
          "/test/deps",
          "/test/head",
          "/test/css",
          "/test/error",
          "/test/not-found",
        ]}
      />
      <div className="flex items-center gap-2 w-sm text-sm">
        <input className="antd-input px-2" placeholder="test-input" />
        <Hydrated />
      </div>
      {props.children}
    </div>
  );
}
