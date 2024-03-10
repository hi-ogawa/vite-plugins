import { Header } from "../components/header";
import { NavMenu } from "../components/nav-menu";

export async function Layout(props: React.PropsWithChildren) {
  return (
    <div>
      <Header />
      <NavMenu />
      {props.children}
    </div>
  );
}
