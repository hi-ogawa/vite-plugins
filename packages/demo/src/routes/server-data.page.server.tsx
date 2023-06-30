import type { LoaderFunction } from "react-router-dom";
import { rpcRoutesQuery } from "../tinyrpc/routes";

export const loader: LoaderFunction = async ({ context }) => {
  await context.queryClient.fetchQuery(
    rpcRoutesQuery.getCounter.queryOptions()
  );
  return null;
};
