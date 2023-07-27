import { useQuery } from "@tanstack/react-query";
import { NavLink } from "react-router-dom";
import { rpcClientQuery } from "../../rpc/client";

export function Component() {
  const meQuery = useQuery(rpcClientQuery.me.queryOptions());

  return (
    <div className="flex flex-col items-center">
      <div className="w-full p-6">
        <div className="flex flex-col gap-4">
          <h2>Session test</h2>
          <div>Is Logged In? ({meQuery.data?.name ? "Yes" : "No"})</div>
          <div className="flex gap-2">
            <NavLink className="border antd-menu-item px-2" to="/session/login">
              /session/login
            </NavLink>
            <NavLink className="border antd-menu-item px-2" to="/session/me">
              /session/me
            </NavLink>
          </div>
        </div>
      </div>
    </div>
  );
}
