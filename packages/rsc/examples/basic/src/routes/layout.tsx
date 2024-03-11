import { Header } from "../components/header";
import { Link } from "../components/link";

export default async function Layout(props: React.PropsWithChildren) {
  return (
    <div className="p-4 flex flex-col gap-2">
      <Header />
      <ul className="flex flex-col items-start gap-1 ml-5 list-disc">
        <li className="antd-link">
          <Link href="/">/</Link>
        </li>
        <li className="antd-link">
          <Link href="/test">/test</Link>
        </li>
        <li className="antd-link">
          <Link href="/demo/waku_02">/demo/waku_02</Link>
        </li>
      </ul>
      {props.children}
    </div>
  );
}
