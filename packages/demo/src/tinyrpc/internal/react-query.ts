import { createGetterProxy } from "./utils";

//
// generate type-safe react-query options wrapper from a record of async functions
//

type FnRecord = Record<string, (...args: any[]) => unknown>;
type FnOutput<F extends (input: any) => unknown> = Awaited<ReturnType<F>>;

export type ReactQueryOptionsProxy<T extends FnRecord> = {
  [K in keyof T]: {
    queryKey: unknown[];
    queryOptions: (...args: Parameters<T[K]>) => {
      queryKey: unknown[];
      queryFn: () => Promise<FnOutput<T[K]>>;
    };
    mutationKey: unknown[];
    mutationOptions: () => {
      mutationKey: unknown[];
      mutationFn: (...args: Parameters<T[K]>) => Promise<FnOutput<T[K]>>;
    };
  };
};

export function createReactQueryOptionsProxy<T extends FnRecord>(
  fnRecord: T
): ReactQueryOptionsProxy<T> {
  return createGetterProxy((k) =>
    createGetterProxy((prop) => {
      if (prop === "queryKey" || prop === "mutationKey") {
        return [k];
      }
      if (prop === "queryOptions") {
        return (input: unknown) => ({
          queryKey: [k, input],
          queryFn: async () => (fnRecord as any)[k](input),
        });
      }
      if (prop === "mutationOptions") {
        return () => ({
          mutationKey: [k],
          mutationFn: async (input: unknown) => (fnRecord as any)[k](input),
        });
      }
      throw new Error(
        `invalid proxy property: k = ${String(k)}, prop = ${String(prop)}`
      );
    })
  ) as any;
}
