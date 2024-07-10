import type { LayoutProps } from "@hiogawa/react-server/server";
import { NavMenu } from "../../../../components/nav-menu";

export default function Layout(props: LayoutProps) {
  return (
    <div className="flex flex-col gap-2 p-2 border">
      <h3>Error Boundary</h3>
      <NavMenu
        links={[
          "/test/error/boundary",
          "/test/error/boundary/dir",
          "/test/error/boundary/dir/redirect",
          "/test/error/boundary/dir/not-found",
          "/test/error/boundary/dir/unexpected",
        ]}
      />
      {props.children}
    </div>
  );
}
