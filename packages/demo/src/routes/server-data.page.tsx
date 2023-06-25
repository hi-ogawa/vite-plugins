import { useQuery } from "@tanstack/react-query";
import { pokomenQueryOption } from "./server-data-utils";

export function Page() {
  const query = useQuery(pokomenQueryOption());

  return (
    <div className="flex flex-col items-center">
      <div className="w-full p-6">
        <div className="flex flex-col gap-4">
          <h1>Server data</h1>
          {query.isSuccess && (
            <>
              <img
                className="self-center w-30 h-30"
                src={query.data.sprites?.front_default}
              />
              <pre className="overflow-auto p-1 border text-sm">
                {JSON.stringify(query.data.sprites, null, 2)}
              </pre>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
