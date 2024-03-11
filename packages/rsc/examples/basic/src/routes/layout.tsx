import { Header } from "../components/header";
import { NavMenu } from "../components/nav-menu";

export default async function Layout(props: React.PropsWithChildren) {
  return (
    <div>
      <Header />
      <NavMenu />
      <input placeholder="test-input" />
      {props.children}
    </div>
  );
}
