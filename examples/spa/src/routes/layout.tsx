import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { createPreloadHandlerRef } from "../utils/preload";

export function Component() {
  return (
    <div>
      <header>
        <h4>Routes</h4>
        <ul>
          {LINKS.map(([href, label]) => (
            <li key={href}>
              <NavLink
                to={href}
                style={(x) => (x.isActive ? { fontWeight: "bold" } : {})}
                ref={createPreloadHandlerRef()}
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
