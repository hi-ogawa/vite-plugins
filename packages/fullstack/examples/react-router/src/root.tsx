import { Link, Outlet } from "react-router";
import "./styles.css";
import { Links } from "./framework/lib";

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
