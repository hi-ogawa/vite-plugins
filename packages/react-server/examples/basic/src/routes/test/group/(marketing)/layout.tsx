import type { LayoutProps } from "@hiogawa/react-server/server";
import { GroupMainMenu } from "../_utils";

export default async function Layout(props: LayoutProps) {
  return (
    <div className="flex flex-col gap-2 p-2 border">
      <h1>(marketing)/layout.tsx</h1>
      <GroupMainMenu />
      <div>{props.children}</div>
    </div>
  );
}
