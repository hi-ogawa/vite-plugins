import { Header } from "../components/header";
import { NavMenu } from "../components/nav-menu";

// TODO: move test pages under routes/test

export default async function Layout(props: React.PropsWithChildren) {
  return (
    <div className="p-4 flex flex-col gap-2">
      <Header />
      <NavMenu />
      <input className="antd-input w-sm px-2" placeholder="test-input" />
      {props.children}
    </div>
  );
}
