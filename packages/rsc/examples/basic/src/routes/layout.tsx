import { Header } from "../components/header";
import { NavMenu } from "../components/nav-menu";

export async function Layout(props: React.PropsWithChildren) {
  return (
    <div>
      <Header />
      <NavMenu />
      <input placeholder="test-hmr" />
      {props.children}
    </div>
  );
}
