import { type LoaderFunction, redirect } from "react-router-dom";
import { rpcRoutesQuery } from "../../tinyrpc/routes";

export const loader: LoaderFunction = async ({ params, context }) => {
  const id = params["id"] ?? "";
  const data = await context.queryClient.fetchQuery(
    rpcRoutesQuery.checkId_GET.queryOptions(id)
  );
  if (!data.ok) {
    throw redirect("/server-redirect?error=server");
  }
  return null;
};
