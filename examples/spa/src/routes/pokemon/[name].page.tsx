import {
  type LoaderFunction,
  useLoaderData,
  useParams,
  useRouteError,
} from "react-router-dom";

export const loader: LoaderFunction = async (args) => {
  const name = args.params["name"]!;
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
  if (!res.ok) {
    throw res;
  }
  return res;
};

// TODO
// need to cheat react-refresh? https://github.com/facebook/react/blob/4e3618ae41669c95a3377ae615c727f74f89d141/packages/react-refresh/src/ReactFreshRuntime.js#L713-L715
// we could introduce `*.page.client.ts` convention to separate `loader` exports but that DX feels also clumsy.
// maybe we could do this "SkipRefresh_xxx" magic via plugin?
Object.defineProperty(loader, "name", { value: "SkipRefresh_loader" });

export function Component() {
  const loaderData = useLoaderData() as any;
  const params = useParams();

  return (
    <div>
      <h4>{params["name"]}</h4>
      <img src={loaderData.sprites.front_default} />
      <span>
        type: {loaderData.types.map((t: any) => t.type.name).join(", ")}
      </span>
      <details>
        <pre>{JSON.stringify(loaderData, null, 2)}</pre>
      </details>
    </div>
  );
}

export function ErrorBoundary() {
  const routeError = useRouteError();
  const params = useParams();

  return (
    <div>
      <h5>Failed to fetch '{params["name"]}'</h5>
      <pre>{JSON.stringify(routeError, null, 2)}</pre>
    </div>
  );
}
