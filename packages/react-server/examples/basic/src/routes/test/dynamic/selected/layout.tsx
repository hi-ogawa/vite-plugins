import type { LayoutProps } from "@hiogawa/react-server/server";
import { NavMenu } from "../../../../components/nav-menu";
import { Selected } from "./_client";

export default function Page(props: LayoutProps) {
  return (
    <div className="flex flex-col gap-2 text-sm">
      <h3 className="font-bold">Test useSelectedParams</h3>
      <NavMenu
        className="grid grid-cols-2 gap-1"
        links={[
          "/test/dynamic/selected",
          "/test/dynamic/selected/x",
          "/test/dynamic/selected/x/y",
          "/test/dynamic/selected/x/static",
          "/test/dynamic/selected/x/static/y",
        ]}
      />
      <pre>
        /layout.tsx: <Selected />
      </pre>
      {props.children}
    </div>
  );
}
