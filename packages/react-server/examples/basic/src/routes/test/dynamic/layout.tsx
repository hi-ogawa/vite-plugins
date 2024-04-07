import type { LayoutProps } from "@hiogawa/react-server/server";
import { NavMenu } from "../../../components/nav-menu";

export default function Layout(props: LayoutProps) {
  return (
    <div className="flex flex-col gap-2 p-2">
      <h3 className="font-bold">Dynamic Route Test</h3>
      <NavMenu
        className="flex flex-col items-start gap-1"
        links={[
          "/test/dynamic",
          "/test/dynamic/static",
          "/test/dynamic/abc",
          "/test/dynamic/🎸 + 🎷 = 🎶",
          "/test/dynamic/" + encodeURI("🎸 + 🎷 = 🎶"),
          "/test/dynamic/abc/def",
        ]}
      />
      <div>{props.children}</div>
    </div>
  );
}
