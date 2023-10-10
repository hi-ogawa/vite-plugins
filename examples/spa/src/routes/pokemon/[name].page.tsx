import {
  type LoaderFunction,
  useLoaderData,
  useParams,
  useRouteError,
} from "react-router-dom";

// see reactRefreshSkipPlugin in vite.config.ts
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
      <table border={1}>
        <thead>
          <tr>
            <th>stat name</th>
            <th>base</th>
            <th>effort</th>
          </tr>
        </thead>
        <tbody>
          {loaderData.stats.map((stat: any) => (
            <tr key={stat.stat.name}>
              <td>{stat.stat.name}</td>
              <td>{stat.base_stat}</td>
              <td>{stat.effort}</td>
            </tr>
          ))}
        </tbody>
      </table>
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
