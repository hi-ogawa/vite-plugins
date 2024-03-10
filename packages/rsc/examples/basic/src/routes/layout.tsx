import { Header } from "../components/header";

export async function Layout(props: React.PropsWithChildren) {
  return (
    <div>
      <Header />
      {props.children}
    </div>
  );
}
