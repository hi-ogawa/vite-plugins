import React from "react";
import { NavLink, Outlet, useNavigate, useNavigation } from "react-router-dom";

export function Component() {
  const navigation = useNavigation();
  const navigate = useNavigate();

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <h4>Pokemon API Demo</h4>
        {navigation.state === "loading" && "(loading...)"}
      </div>
      <div>
        <ul>
          {["pikachu", "charizard", "onix"].map((v) => (
            <li key={v}>
              <NavLink
                to={`/pokemon/${v}`}
                style={(x) => (x.isActive ? { fontWeight: "bold" } : {})}
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
