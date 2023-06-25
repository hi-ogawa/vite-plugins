import { tinyassert } from "@hiogawa/utils";
import { type QueryObserverOptions, useQuery } from "@tanstack/react-query";
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { sleep } from "../../utils/misc";

export function Page() {
  const params = useParams();

  // check server and redirect on error
  const checkQuery = useQuery(dummyClientCheckQueryOptions(params["id"]!));

  const navigate = useNavigate();

  React.useEffect(() => {
    if (checkQuery.error) {
      navigate("/client-redirect?error=client");
    }
  }, [checkQuery.error]);

  if (checkQuery.isLoading) {
    return <div className="mt-10 mx-auto antd-spin w-10 h-10"></div>;
  }

  return <PageInner data={checkQuery.data} />;
}

function dummyClientCheckQueryOptions(id: string) {
  return {
    queryKey: ["client-redirect-check", id],
    queryFn: async () => {
      await sleep(1000);
      tinyassert(id === "good");
      return { message: "success!" };
    },
  } satisfies QueryObserverOptions;
}

function PageInner(props: { data: unknown }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-full p-6">
        <div className="flex flex-col gap-4">
          <h1>Client redirect</h1>
          <pre>{JSON.stringify(props.data)}</pre>
        </div>
      </div>
    </div>
  );
}
