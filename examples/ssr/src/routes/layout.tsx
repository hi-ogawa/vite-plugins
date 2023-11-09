import React from "react";
import { Link, Outlet } from "react-router-dom";

export function Component() {
  return (
    <div>
      <header>
        <h4>
          SSR Demo
          <a
            style={{ fontSize: "0.8rem", marginLeft: "0.3rem" }}
            href="https://github.com/hi-ogawa/vite-plugins/tree/main/examples/ssr"
            target="_blank"
          >
            (source code)
          </a>
        </h4>
        <ul>
          <li>
            <Link to="/">Index</Link>
          </li>
          <li>
            <Link to="/loader-data">Loader Data</Link>
          </li>
          <li>
            <a href="/hello">Hello API</a>
          </li>
        </ul>
      </header>
      <div>
        <Outlet />
      </div>
    </div>
  );
}
