import { useLoaderData } from "react-router-dom";

// TODO: auto inject via plugin option?
//       or allow customizing `RouteObject` when calling `globPageRoutes()`?
//       then client build has to be aware of existance of server loader for given page?
//       which could be achieved by server passing "route manifest" during runtime?
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
