import { type LoaderFunction } from "react-router-dom";
import { getServerContext } from "../../server/server-context";
import { serverRedirectCheckQueryOptions } from "./check.api";

export const loader: LoaderFunction = async ({ params }) => {
  const { queryClient } = getServerContext();
  const id = params["id"] ?? "";
  // note that we don't use `prefetchQuery` since it would swallow "throw redirect inside `queryFn`.
  await queryClient.fetchQuery(serverRedirectCheckQueryOptions(id));
  return null;
};
