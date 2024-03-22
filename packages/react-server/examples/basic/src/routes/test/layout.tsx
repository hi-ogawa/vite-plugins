import { NavMenu } from "../../components/nav-menu";
import { Hydrated } from "./_client";

export default async function Layout(props: React.PropsWithChildren) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-lg">Test</h2>
      <NavMenu
        className="grid grid-cols-2 w-xs gap-1"
        links={[
          "/test",
          "/test/other",
          "/test/action",
          "/test/deps",
          "/test/head",
          "/test/css",
          "/test/not-found",
        ]}
      />
      <input className="antd-input w-sm px-2" placeholder="test-input" />
      <Hydrated />
      {props.children}
    </div>
  );
}
