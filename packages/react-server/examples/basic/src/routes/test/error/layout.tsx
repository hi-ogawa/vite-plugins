import type { LayoutProps } from "@hiogawa/react-server/server";
import { NavMenu } from "../../../components/nav-menu";

export default function Layout(props: LayoutProps) {
  return (
    <div className="flex flex-col gap-2 p-2">
      <h4 className="font-bold">Error Test</h4>
      <NavMenu
        className="flex flex-col items-start gap-1"
        links={[
          "/test/error/not-found",
          "/test/error/server?500",
          "/test/error/server?custom",
          "/test/error/browser",
          "/test/error/use-client",
          "/test/error/use-server",
          "/test/error/hydration",
          "/test/error/boundary",
        ]}
      />
      <div>{props.children}</div>
    </div>
  );
}
