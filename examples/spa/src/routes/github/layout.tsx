import React from "react";
import { Outlet, useNavigation } from "react-router-dom";

export function Component() {
  const navigation = useNavigation();

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <h4>Github API Demo</h4>
        {navigation.state === "loading" && "(loading...)"}
      </div>
      <div>
        <Outlet />
      </div>
    </div>
  );
}
