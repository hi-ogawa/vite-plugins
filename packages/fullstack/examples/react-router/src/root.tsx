import { Link, Outlet, useMatches } from "react-router";
import "./styles.css";
import type { AssetsHandle } from "./routes";

export function Component() {
  return (
    <html lang="en">
      <head>
        <title>React Router Custom Framework</title>
        <Links />
      </head>
      <body>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/about">About</Link>
          </li>
        </ul>
        <Outlet />
      </body>
    </html>
  );
}

function Links() {
  const matches = useMatches();
  const handles = matches.map((m) => m.handle as AssetsHandle);
  console.log(JSON.stringify(matches, null, 2));
  return (
    <>
      {handles
        .flatMap((h) => [
          ...h.assets.client.js,
          ...(h.assets.client.entry ? [{ href: h.assets.client.entry }] : []),
        ])
        .map((attrs) => (
          <link
            {...attrs}
            rel="modulepreload"
            key={attrs.href}
            crossOrigin=""
          />
        ))}
      {handles
        .map((h) => h.assets.server.css)
        .flat()
        .map((attrs) => (
          <link {...attrs} rel="stylesheet" key={attrs.href} crossOrigin="" />
        ))}
    </>
  );
}
