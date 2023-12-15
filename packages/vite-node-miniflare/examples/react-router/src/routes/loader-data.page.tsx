import { useLoaderData } from "react-router-dom";

export function Component() {
  const loaderData = useLoaderData();

  return (
    <div>
      Loader data page
      <pre>loaderData = {JSON.stringify(loaderData, null, 2)}</pre>
    </div>
  );
}
