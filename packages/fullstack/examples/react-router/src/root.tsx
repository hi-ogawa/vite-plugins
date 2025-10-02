import { NavLink, Outlet } from "react-router";
import { Links } from "./framework/lib";
import "./styles.css";

export function Component() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>React Router Custom Framework</title>
        <Links />
      </head>
      <body>
        <nav>
          <ul>
            <li>
              <NavLink to="/">Home</NavLink>
            </li>
            <li>
              <NavLink to="/about">About</NavLink>
            </li>
          </ul>
        </nav>
        <Outlet />
      </body>
    </html>
  );
}
