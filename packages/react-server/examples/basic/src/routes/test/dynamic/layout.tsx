import type { LayoutProps } from "@hiogawa/react-server/server";
import { NavMenu } from "../../../components/nav-menu";

export default function Layout(props: LayoutProps) {
  return (
    <div className="flex flex-col gap-2 p-2">
      <h3 className="font-bold">Dynamic Route Test</h3>
      <NavMenu
        className="grid grid-cols-2 gap-1"
        links={[
          "/test/dynamic",
          "/test/dynamic/static",
          "/test/dynamic/abc",
          // these two should work same inside the application?
          "/test/dynamic/✅",
          "/test/dynamic/" + encodeURI("✅"),
          "/test/dynamic/abc/def",
          "/test/dynamic/catchall/static",
          "/test/dynamic/catchall/x",
          "/test/dynamic/catchall/x/y",
          "/test/dynamic/catchall/x/y/z",
          "/test/dynamic/catchall/x/y/w",
          "/test/dynamic/selected",
        ]}
        activeProps={{
          "aria-current": "page",
        }}
      />
      <div>{props.children}</div>
    </div>
  );
}
