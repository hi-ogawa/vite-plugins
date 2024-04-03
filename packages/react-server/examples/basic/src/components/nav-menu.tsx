import { Link } from "@hiogawa/react-server/client";

export function NavMenu(props: { links: string[]; className?: string }) {
  return (
    <ul className={props.className}>
      {props.links.map((e) => (
        <Link
          key={e}
          href={e}
          className="antd-link self-start justify-self-start"
          prefetch
        >
          <li className="flex items-center">
            <span className="text-lg pr-2 select-none">•</span>
            {e}
          </li>
        </Link>
      ))}
    </ul>
  );
}
