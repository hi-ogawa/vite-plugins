import { useLoaderData } from "react-router-dom";

export function Component() {
  const loaderData = useLoaderData();
  return (
    <div className="flex flex-col items-center">
      <div className="w-full p-6">
        <div className="flex flex-col gap-4">
          <h1>Server redirect</h1>
          <pre>{JSON.stringify(loaderData)}</pre>
        </div>
      </div>
    </div>
  );
}
