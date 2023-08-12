import { type LoaderFunction, useLoaderData } from "react-router-dom";

export const loader: LoaderFunction = async () => {
  return { message: "hey loader" };
};

// cheat react-refresh https://github.com/facebook/react/blob/4e3618ae41669c95a3377ae615c727f74f89d141/packages/react-refresh/src/ReactFreshRuntime.js#L713-L715
Object.defineProperty(loader, "name", { value: "SkipRefresh_loader" });

export function Component() {
  const loaderData = useLoaderData() as any;

  return (
    <div>
      hmr? foo hello
      <pre>{JSON.stringify(loaderData, null, 2)}</pre>
    </div>
  );
}
