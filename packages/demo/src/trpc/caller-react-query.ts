import type {
  AnyRouter,
  inferRouterInputs,
  inferRouterOutputs,
} from "@trpc/server";
import { createGetterProxy } from "../utils/misc";
import type { TrpcCaller } from "./caller";
import { trpcRouter } from "./router";

export type TrpcCallerQ = CallerReactQueryIntegration<typeof trpcRouter>;

export function createTrpcCallerQ(trpcCaller: TrpcCaller): TrpcCallerQ {
  return createCallerReactQueryIntegration<typeof trpcRouter>(trpcCaller);
}

type CallerReactQueryIntegration<
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
  };
};

function createCallerReactQueryIntegration<Router extends AnyRouter>(
  caller: any
): CallerReactQueryIntegration<Router> {
  return createGetterProxy((k) =>
    createGetterProxy((prop) => {
      if (prop === "queryKey") {
        return [k];
      }
      if (prop === "queryOptions") {
        return (input: unknown) => ({
          queryKey: [k, input],
          queryFn: () => caller[k](input),
        });
      }
      throw new Error(`invalid trpc invocation: ${String(k)} ${String(prop)}`);
    })
  ) as any;
}
