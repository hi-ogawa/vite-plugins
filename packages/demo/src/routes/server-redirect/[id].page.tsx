import { useQuery } from "@tanstack/react-query";
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { trpcClientQuery } from "../../trpc/client";

export function Component() {
  const params = useParams();

  // fetch on client only when it's not prefetched during SSR
  const checkQuery = useQuery({
    ...trpcClientQuery.checkId.queryOptions(params["id"]!),
    staleTime: Infinity,
  });

  const navigate = useNavigate();

  React.useEffect(() => {
    if (checkQuery.data && !checkQuery.data.ok) {
      navigate("/server-redirect?error=client");
    }
  }, [checkQuery.data]);

  if (checkQuery.isLoading) {
    return <div className="mt-10 mx-auto antd-spin w-10 h-10"></div>;
  }

  return <PageInner data={checkQuery.data} />;
}

function PageInner(props: { data: unknown }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-full p-6">
        <div className="flex flex-col gap-4">
          <h1>Server redirect</h1>
          <pre>{JSON.stringify(props.data)}</pre>
        </div>
      </div>
    </div>
  );
}
