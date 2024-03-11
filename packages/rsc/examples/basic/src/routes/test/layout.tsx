import { NavMenu } from "../../components/nav-menu";

export default async function Layout(props: React.PropsWithChildren) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-lg">Test</h2>
      <NavMenu />
      <input className="antd-input w-sm px-2" placeholder="test-input" />
      {props.children}
    </div>
  );
}
