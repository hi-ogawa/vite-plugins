import type { LayoutProps } from "@hiogawa/react-server/server";
import { NavMenu } from "../../../components/nav-menu";
import { EffectCount } from "../_client";

export default function Layout(props: LayoutProps) {
  return (
    <div className="flex flex-col gap-3 p-2">
      <h3 className="font-bold">Revalidate Test</h3>
      <NavMenu
        links={["/test/revalidate", "/test/revalidate/x", "/test/revalidate/y"]}
      />
      <EffectCount />
      {props.children}
    </div>
  );
}
