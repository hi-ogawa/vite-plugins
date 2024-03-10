import { Link } from "./link";

export function NavMenu() {
  return (
    <ul>
      <li>
        <Link href="/">/</Link>
      </li>
      <li>
        <Link href="/other">/other</Link>
      </li>
      <li>
        <Link href="/not-found">/not-found</Link>
      </li>
    </ul>
  );
}
