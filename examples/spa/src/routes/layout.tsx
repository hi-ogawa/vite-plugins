import React from "react";
import { NavLink, Outlet } from "react-router-dom";

export function Component() {
  return (
    <div>
      <header>
        <h4>
          SPA Demo
          <a
            style={{ fontSize: "0.8rem", marginLeft: "0.3rem" }}
            href="https://github.com/hi-ogawa/vite-plugins/tree/main/examples/spa"
            target="_blank"
          >
            (source code)
          </a>
        </h4>
        <ul>
          {LINKS.map(([href, label]) => (
            <li key={href}>
              <NavLink
                to={href}
                style={(x) => (x.isActive ? { fontWeight: "bold" } : {})}
                data-preload
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </header>
      <div>
        <Outlet />
      </div>
    </div>
  );
}

const LINKS = [
  ["/", "Index Page"],
  ["/pokemon", "Pokemon API Demo"],
] as const;
