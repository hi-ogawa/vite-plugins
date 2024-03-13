import { Link } from "@hiogawa/react-server/client";

export default async function Layout(props: React.PropsWithChildren) {
  return (
    <div>
      <h3>React Server Starter</h3>
      <nav>
        <ul>
          <li>
            <Link href="/">Home</Link>
          </li>
          <li>
            <Link href="/counter">Counter</Link>
          </li>
          <li>
            <Link href="/server-action">Server Action</Link>
          </li>
        </ul>
      </nav>
      {props.children}
    </div>
  );
}
