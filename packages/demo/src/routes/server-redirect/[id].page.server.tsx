import { type LoaderFunction, redirect } from "react-router-dom";
import {
  type CheckOutput,
  serverRedirectCheck,
  serverRedirectCheckQueryOptions,
} from "./check.api";

export const loader: LoaderFunction = async ({ params, context }) => {
  const id = params["id"] ?? "";
  const ok = await serverRedirectCheck(id);
  if (!ok) {
    throw redirect("/server-redirect?error=server");
  }

  // note that `prefetchQuery(...queryFn)` swallows errors from `queryFn`
  // so `throw redirect` logic has to come outside of `queryFn`
  await context.queryClient.prefetchQuery({
    ...serverRedirectCheckQueryOptions(id),
    queryFn: () =>
      ({
        ok,
        message: "ssr prefetch",
      } satisfies CheckOutput),
  });
  return null;
};
