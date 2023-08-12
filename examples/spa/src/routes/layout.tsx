import React from "react";
import { Link, Outlet } from "react-router-dom";

export function Component() {
  return (
    <div>
      <header>
        <h4>Routes</h4>
        <ul>
          <li>
            <Link to="/">Index Page</Link>
          </li>
          <li>
            <Link to="/github">Github API Demo</Link>
          </li>
        </ul>
      </header>
      <div>
        <Outlet />
      </div>
    </div>
  );
}
