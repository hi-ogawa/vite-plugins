import { Link } from "./link";

export function NavMenu() {
  return (
    <ul className="flex flex-col items-start gap-1 ml-5 list-disc">
      <li className="antd-link">
        <Link href="/test">/test</Link>
      </li>
      <li className="antd-link">
        <Link href="/test/other">/test/other</Link>
      </li>
      <li className="antd-link">
        <Link href="/test/not-found">/test/not-found</Link>
      </li>
    </ul>
  );
}
