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
          "/test/action/extra",
          "/test/deps",
          "/test/head",
          "/test/css",
          "/test/assets",
          "/test/error",
          "/test/transition",
          "/test/redirect",
          "/test/session",
          "/test/client",
          "/test/revalidate",
          "/test/loading",
          "/test/cache",
          "/test/metadata",
          "/test/template",
          "/test/api",
          "/test/group",
          "/test/catchall-opt",
        ]}
      />
      <div className="flex items-center gap-2 text-sm">
        <input className="antd-input px-2" placeholder="test-input" />
        <Hydrated />
        <EffectCount />
        <div>[now: {Date.now()}]</div>
      </div>
      {props.children}
    </div>
  );
}
