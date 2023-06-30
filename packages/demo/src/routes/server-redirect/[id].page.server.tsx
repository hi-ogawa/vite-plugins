import { type LoaderFunction, redirect } from "react-router-dom";
import { getServerContext } from "../../server/server-context";
import { trpcCallerQuery } from "../../trpc/router";

export const loader: LoaderFunction = async ({ params }) => {
  const { queryClient } = getServerContext();
  const id = params["id"] ?? "";
  const queryOptions = trpcCallerQuery.checkId.queryOptions(id);
  const data = await queryClient.fetchQuery(queryOptions);
  if (!data.ok) {
    throw redirect("/server-redirect?error=server");
  }
  queryClient.setQueryData(queryOptions.queryKey, {
    ok: true,
    message: "ssr",
  });
  return null;
};
