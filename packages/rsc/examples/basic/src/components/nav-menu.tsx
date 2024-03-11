import { Link } from "./link";

export function NavMenu() {
  return (
    <ul className="flex flex-col items-start gap-1 ml-5 list-disc">
      <li className="antd-link">
        <Link href="/">/</Link>
      </li>
      <li className="antd-link">
        <Link href="/other">/other</Link>
      </li>
      <li className="antd-link">
        <Link href="/not-found">/not-found</Link>
      </li>
    </ul>
  );
}
