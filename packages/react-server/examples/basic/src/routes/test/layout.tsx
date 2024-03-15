import { NavMenu } from "../../components/nav-menu";
import { Hydrated } from "./hydrated";

export default async function Layout(props: React.PropsWithChildren) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-lg">Test</h2>
      <NavMenu
        links={[
          "/test",
          "/test/other",
          "/test/action",
          "/test/deps",
          "/test/not-found",
        ]}
      />
      <input className="antd-input w-sm px-2" placeholder="test-input" />
      <Hydrated />
      {props.children}
    </div>
  );
}
