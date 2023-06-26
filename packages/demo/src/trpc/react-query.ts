import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { trpcClient } from "./client";
import type { trpcRouter } from "./router";

// copied from https://github.com/hi-ogawa/ytsub-v3/blob/af2eff04d17f346b9bf417dd0fb42849ef472147/app/trpc/client.ts#L10-L17

type Inputs = inferRouterInputs<typeof trpcRouter>;
type Outputs = inferRouterOutputs<typeof trpcRouter>;

type ReactQueryIntegration = {
  [K in keyof Inputs]: {
    queryKey: K;
    queryOptions: (input: Inputs[K]) => {
      queryKey: unknown[];
      queryFn: () => Promise<Outputs[K]>;
    };
    mutationKey: K;
    mutationOptions: () => {
      mutationKey: unknown[];
      mutationFn: (input: Inputs[K]) => Promise<Outputs[K]>;
    };
  };
};

// prettier-ignore
export const trpcRQ =
  createGetterProxy((k) =>
    createGetterProxy(prop => {
      if (prop === "queryKey" || prop === "mutationKey") {
        return k;
      }
      if (prop === "queryOptions") {
        return (input: unknown) => ({
          queryKey: [k, input],
          queryFn: () => (trpcClient as any)[k].query(input),
        })
      }
      if (prop === "mutationOptions") {
        return () => ({
          mutationKey: [k],
          mutationFn: (input: unknown) => (trpcClient as any)[k].mutate(input),
        })
      }
      throw new Error(`invalid trpcRQ access: ${String(k)} ${String(prop)}`);
    })
  ) as ReactQueryIntegration;

function createGetterProxy(
  propHandler: (prop: string | symbol) => unknown
): unknown {
  return new Proxy(
    {},
    {
      get(_target, prop, _receiver) {
        return propHandler(prop);
      },
    }
  );
}
