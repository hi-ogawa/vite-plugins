import type { LayoutProps } from "@hiogawa/react-server/server";
import { NavMenu } from "../../../components/nav-menu";

export default function Layout(props: LayoutProps) {
  return (
    <div className="flex flex-col gap-2 p-2 border">
      <h1>Optional Catch-all</h1>
      <NavMenu
        className="grid grid-cols-3 gap-1"
        links={["/test/catchall-opt/x", "/test/catchall-opt/x/y"]}
      />
      {props.children}
    </div>
  );
}
