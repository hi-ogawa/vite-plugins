import { useQuery } from "@tanstack/react-query";
import { pokomenQueryOption } from "./server-data-utils";

export function Component() {
  const query = useQuery(pokomenQueryOption());

  return (
    <div className="flex flex-col items-center">
      <div className="w-full p-6">
        <div className="flex flex-col gap-4">
          <h1>Server data</h1>
          {query.isLoading && (
            <div className="mt-4 mx-auto antd-spin w-10 h-10"></div>
          )}
          {query.isSuccess && (
            <>
              <img
                className="self-center w-30 h-30"
                src={query.data.sprites?.front_default}
              />
              <pre className="overflow-auto p-1 border text-sm">
                {JSON.stringify(query.data, null, 2)}
              </pre>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
