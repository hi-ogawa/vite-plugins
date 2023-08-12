import {
  type LoaderFunction,
  useLoaderData,
  useParams,
  useRouteError,
} from "react-router-dom";

// @x-refresh-skip loader

export const loader: LoaderFunction = async (args) => {
  const name = args.params["name"]!;
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
  if (!res.ok) {
    throw res;
  }
  return res;
};

export function Component() {
  const loaderData = useLoaderData() as any;
  const params = useParams();

  return (
    <div>
      <h4>{params["name"]}</h4>
      <img src={loaderData.sprites.front_default} />
      <span>
        Type: {loaderData.types.map((t: any) => t.type.name).join(", ")}
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
