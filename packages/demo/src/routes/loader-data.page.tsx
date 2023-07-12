import { useLoaderData } from "react-router-dom";

// TODO: how to avoid calling on initial render after SSR?
//       this might be relevant
//       https://github.com/remix-run/react-router/blob/9c1892ac4d222135a0d1a5033aad4f1fcfab11df/packages/router/router.ts#L791-L796
//       https://github.com/remix-run/react-router/blob/9c1892ac4d222135a0d1a5033aad4f1fcfab11df/packages/router/router.ts#L942-L949
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
