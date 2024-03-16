import { useMutation } from "@tanstack/react-query";
import { useLoaderData } from "react-router-dom";
import { rpcClientQuery } from "../../rpc/client";
import type { LoaderData } from "./me.page.server";

export function Component() {
  const loaderData = useLoaderData() as LoaderData;

  const logoutMutation = useMutation({
    ...rpcClientQuery.logout.mutationOptions(),
    onSuccess: () => {
      window.location.href = "/session";
    },
  });

  return (
    <div className="flex flex-col items-center">
      <div className="w-full p-6">
        <div className="flex items-center gap-3">
          <div>Hello, {loaderData.name}</div>
          <button
            className="antd-btn antd-btn-default px-2"
            onClick={() => logoutMutation.mutate()}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
