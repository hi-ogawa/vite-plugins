import { Link } from "@hiogawa/react-server/client";

export function NavMenu(props: { links: string[]; className?: string }) {
  return (
    <ul className={props.className ?? "flex flex-col items-start gap-1"}>
      {props.links.map((e) => (
        <li key={e} className="flex items-start">
          <Link className="antd-link flex items-center" href={e}>
            <span className="text-lg pr-2">•</span>
            {e}
          </Link>
        </li>
      ))}
    </ul>
  );
}
