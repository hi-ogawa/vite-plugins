import type { LayoutProps } from "@hiogawa/react-server/server";
import { NavMenu } from "../../../components/nav-menu";

export default function Layout(props: LayoutProps) {
  return (
    <div className="flex flex-col gap-2">
      <h5 className="font-bold">css</h5>
      <NavMenu links={["/test/css/in-js"]} />
      {props.children}
    </div>
  );
}
