import type { LoaderFunction } from "react-router-dom";

export const loader: LoaderFunction = async ({ context }) => {
  await context.queryClient.fetchQuery(
    context.rpcQuery.getCounter.queryOptions()
  );
  return null;
};
