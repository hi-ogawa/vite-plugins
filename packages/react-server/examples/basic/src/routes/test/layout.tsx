import type { LayoutProps } from "@hiogawa/react-server/server";
import { NavMenu } from "../../components/nav-menu";
import { EffectCount, Hydrated } from "./_client";

export default async function Layout(props: LayoutProps) {
  return (
    <div className="flex flex-col gap-2 max-w-lg">
      <h2 className="text-lg">Test</h2>
      <NavMenu
        className="grid grid-cols-3 gap-1"
        links={[
          "/test",
          "/test/other",
          "/test/dynamic",
          "/test/action",
          "/test/deps",
          "/test/head",
          "/test/css",
          "/test/error",
          "/test/not-found",
          "/test/transition",
          "/test/redirect",
          "/test/session",
          "/test/client",
          "/test/revalidate",
        ]}
      />
      <div className="flex items-center gap-2 text-sm">
        <input className="antd-input px-2" placeholder="test-input" />
        <Hydrated />
        <EffectCount />
      </div>
      {props.children}
    </div>
  );
}
