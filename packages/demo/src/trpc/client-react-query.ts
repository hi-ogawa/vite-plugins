import type {
  AnyRouter,
  inferRouterInputs,
  inferRouterOutputs,
} from "@trpc/server";
import { createGetterProxy } from "../utils/misc";
import { trpcClient } from "./client";
import { trpcRouter } from "./router";

export const trpcQ =
  createClientReactQueryIntegration<typeof trpcRouter>(trpcClient);

type ClientReactQueryIntegration<
  Router extends AnyRouter,
  I = inferRouterInputs<Router>,
  O = inferRouterOutputs<Router>
> = {
  [K in keyof I & keyof O]: {
    queryKey: unknown[];
    queryOptions: (input: I[K]) => {
      queryKey: unknown[];
      queryFn: () => Promise<O[K]>;
    };
    mutationKey: unknown[];
    mutationOptions: () => {
      mutationKey: unknown[];
      mutationFn: (input: I[K]) => Promise<O[K]>;
    };
  };
};

function createClientReactQueryIntegration<Router extends AnyRouter>(
  client: any
): ClientReactQueryIntegration<Router> {
  return createGetterProxy((k) =>
    createGetterProxy((prop) => {
      if (prop === "queryKey" || prop === "mutationKey") {
        return [k];
      }
      if (prop === "queryOptions") {
        return (input: unknown) => ({
          queryKey: [k, input],
          queryFn: () => client[k].query(input),
        });
      }
      if (prop === "mutationOptions") {
        return () => ({
          mutationKey: [k],
          mutationFn: (input: unknown) => client[k].mutate(input),
        });
      }
      throw new Error(`invalid trpc invocation: ${String(k)} ${String(prop)}`);
    })
  ) as any;
}
