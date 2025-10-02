import { Link, Outlet } from "react-router";
import "./styles.css";

export function Component() {
  return (
    <html lang="en">
      <head>
        <title>React Router Custom Framework</title>
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
