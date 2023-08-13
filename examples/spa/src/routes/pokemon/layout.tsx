import React from "react";
import { NavLink, Outlet, useNavigate, useNavigation } from "react-router-dom";
import { createPreloadHandlerRef } from "../../utils/preload";

export function Component() {
  const navigation = useNavigation();
  const navigate = useNavigate();

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <h4>Pokemon API Demo</h4>
        {navigation.state === "loading" && "(loading...)"}
      </div>
      (API provided by{" "}
      <a href="https://pokeapi.co/" target="_blank">
        PokéAPI
      </a>
      )
      <div>
        <ul>
          {["pikachu", "charizard", "onix"].map((v) => (
            <li key={v}>
              <NavLink
                to={`/pokemon/${v}`}
                style={(x) => (x.isActive ? { fontWeight: "bold" } : {})}
                ref={createPreloadHandlerRef()}
              >
                {v}
              </NavLink>
            </li>
          ))}
          <li>
            <input
              placeholder="Input..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const v = e.currentTarget.value;
                  if (v) {
                    navigate(`/pokemon/${v}`);
                  }
                }
              }}
            />
          </li>
        </ul>
        <Outlet />
      </div>
    </div>
  );
}
