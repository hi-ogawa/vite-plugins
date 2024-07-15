import Link from "next/link";

export default function Page() {
  return (
    <div>
      <h2>Test</h2>
      <ul>
        {links.map((href) => (
          <li key={href}>
            <Link href={href}>{href}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

const links = [
  "/actions/client",
  "/actions/server",
  "/actions/header",
  "/actions/mutate-cookie",
  "/navigation",
  "/navigation/router",
  "/navigation/redirect/servercomponent",
  "/navigation/redirect/servercomponent2",
  "/navigation/not-found/servercomponent",
  "/test/middleware/redirect",
];
