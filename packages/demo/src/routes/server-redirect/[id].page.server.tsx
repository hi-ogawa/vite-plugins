import { type LoaderFunction, redirect } from "react-router-dom";

export const loader: LoaderFunction = async ({ params, context }) => {
  const id = params["id"] ?? "";
  const data = await context.queryClient.fetchQuery(
    context.rpcQuery.checkId.queryOptions({ id, message: "ssr" })
  );
  if (!data.ok) {
    throw redirect("/server-redirect?error=server");
  }
  return null;
};
