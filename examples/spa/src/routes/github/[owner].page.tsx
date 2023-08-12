import {
  type LoaderFunction,
  redirect,
  useLoaderData,
  useParams,
  useRouteError,
} from "react-router-dom";
import { RepoListComponent } from "../../components/repo-list";

// TODO
// HMR doesn't work when editing `*.page.tsx` since it includes non-component `loader` export.
// Maybe better to introduce `*.page.client.ts` convention to workaround it?
export const loader: LoaderFunction = async (args) => {
  const owner = args.params["owner"];
  if (!owner) {
    throw redirect("/github");
  }
  const res = await fetch(`https://ungh.cc/orgs/${owner}/repos`);
  if (!res.ok) {
    throw res;
  }
  return res;
};

export function Component() {
  const loaderData = useLoaderData();
  const params = useParams();

  return (
    <div>
      <h5>Repositories of '{params["owner"]}'</h5>
      <RepoListComponent data={loaderData as any} />
    </div>
  );
}

export function ErrorBoundary() {
  const routeError = useRouteError();
  const params = useParams();

  return (
    <div>
      <h5>Failed to fetch repositories of '{params["owner"]}'</h5>
      <pre>{JSON.stringify(routeError, null, 2)}</pre>
    </div>
  );
}
