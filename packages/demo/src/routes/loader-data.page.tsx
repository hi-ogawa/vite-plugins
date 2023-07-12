import { useLoaderData } from "react-router-dom";

export { proxyServerLoader as loader } from "@hiogawa/vite-glob-routes/dist/react-router";

export function Component() {
  const loaderData = useLoaderData();

  return (
    <div className="flex flex-col items-center">
      <div className="w-full p-6">
        <div className="flex flex-col gap-4">
          <h1>Loader data</h1>
          <pre className="flex items-center gap-3 border p-3">
            {JSON.stringify(loaderData, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
