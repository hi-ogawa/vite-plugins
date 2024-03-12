import { Link } from "./link";

export function NavMenu(props: { links: string[] }) {
  return (
    <ul className="flex flex-col items-start gap-1">
      {props.links.map((e) => (
        <li key={e} className="antd-link">
          <Link href={e}>
            <span className="text-lg pr-2">•</span>
            {e}
          </Link>
        </li>
      ))}
    </ul>
  );
}
