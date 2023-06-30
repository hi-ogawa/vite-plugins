import { type LoaderFunction } from "react-router-dom";
import { serverRedirectCheckQueryOptions } from "./check.api";

export const loader: LoaderFunction = async ({ params, context }) => {
  const id = params["id"] ?? "";
  // note that we don't use `prefetchQuery` since it would swallow "throw redirect inside `queryFn`.
  await context.queryClient.fetchQuery(serverRedirectCheckQueryOptions(id));
  return null;
};
