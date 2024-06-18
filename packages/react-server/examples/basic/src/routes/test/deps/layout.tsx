import type { LayoutProps } from "@hiogawa/react-server/server";
import { NavMenu } from "../../../components/nav-menu";

export default function Layout(props: LayoutProps) {
  return (
    <div className="flex flex-col gap-2 p-2">
      <h4 className="font-bold">Test Dependencies</h4>
      <NavMenu links={["/test/deps", "/test/deps/react-tweet"]} />
      {props.children}
    </div>
  );
}
