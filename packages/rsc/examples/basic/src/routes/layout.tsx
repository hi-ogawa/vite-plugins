import { Header } from "../components/header";

export async function Layout(props: React.PropsWithChildren) {
  return (
    <div>
      <Header />
      <ul>
        <li>
          <a href="/">/</a>
        </li>
        <li>
          <a href="/other">/other</a>
        </li>
      </ul>
      {props.children}
    </div>
  );
}
