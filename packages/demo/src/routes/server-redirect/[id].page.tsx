import { useQuery } from "@tanstack/react-query";
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { dummyCheckQueryOptions } from "./[id].page.server";

export function Component() {
  const params = useParams();

  // check server and redirect on error
  const checkQuery = useQuery({
    ...dummyCheckQueryOptions(params["id"]!),
    // TODO: need to handle error via ErrorBoundary
    suspense: true,
  });

  const navigate = useNavigate();

  React.useEffect(() => {
    if (checkQuery.error) {
      navigate("/server-redirect?error=client");
    }
  }, [checkQuery.error]);

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
