import { Header } from "../components/header";
import { NavMenu } from "../components/nav-menu";

export default async function Layout(props: React.PropsWithChildren) {
  return (
    <div className="p-2 flex flex-col gap-2">
      <Header />
      <NavMenu />
      <input className="antd-input w-sm px-2" placeholder="test-input" />
      {props.children}
    </div>
  );
}
