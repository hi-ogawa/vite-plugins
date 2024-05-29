import { Link } from "@hiogawa/react-server/client";

export function NavMenu(props: {
  links: string[];
  className?: string;
  activeProps?: JSX.IntrinsicElements["a"];
}) {
  return (
    <ul className={props.className}>
      {props.links.map((e) => (
        <Link
          key={e}
          href={e}
          className="antd-link self-start justify-self-start"
          activeProps={props.activeProps}
        >
          <li className="flex items-center pt-0.5 before:content-['•'] before:pr-2">
            {e}
          </li>
        </Link>
      ))}
    </ul>
  );
}
