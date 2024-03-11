import { Header } from "../components/header";
import { NavMenu } from "../components/nav-menu";

export default async function Layout(props: React.PropsWithChildren) {
  return (
    <div className="p-4 flex flex-col gap-2">
      <Header />
      <NavMenu links={["/", "/test", "/demo/waku_02"]} />
      {props.children}
    </div>
  );
}
