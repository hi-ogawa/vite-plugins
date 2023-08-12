import React from "react";
import { Link, Outlet } from "react-router-dom";

export function Component() {
  return (
    <div>
      <header>
        Routes
        <ul>
          <li>
            <Link to="/">Index</Link>
          </li>
          <li>
            <Link to="/loader-data">Loader Data</Link>
          </li>
        </ul>
      </header>
      <div>
        <Outlet />
      </div>
    </div>
  );
}
