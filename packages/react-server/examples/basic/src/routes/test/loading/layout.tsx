import type { LayoutProps } from "@hiogawa/react-server/server";
import { NavMenu } from "../../../components/nav-menu";

export default function Layout(props: LayoutProps) {
  return (
    <div className="flex flex-col gap-2 p-2">
      <h4 className="font-bold">Loading</h4>
      <NavMenu
        links={["/test/loading", "/test/loading/1", "/test/loading/2"]}
      />
      {props.children}
    </div>
  );
}
