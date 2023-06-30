import { createGetterProxy } from "./utils";

//
// generate type-safe react-query options wrapper from a record of async functions
//

type FnAny = (...args: any[]) => any;
type FnAnyToAsync<F extends FnAny> = (
  ...args: Parameters<F>
) => Promise<Awaited<ReturnType<F>>>;

export type FnRecord = Record<string, FnAny>;
export type FnRecordToAsync<R extends FnRecord> = {
  [K in keyof R]: FnAnyToAsync<R[K]>;
};

type FnInput<F extends FnAny> = Parameters<F> extends [infer I] ? I : void;
type FnOutput<F extends FnAny> = Awaited<ReturnType<F>>;

export type ReactQueryOptionsProxy<T extends FnRecord> = {
  [K in keyof T]: {
    queryKey: unknown[];
    queryOptions: (input: FnInput<T[K]>) => {
      queryKey: unknown[];
      queryFn: () => Promise<FnOutput<T[K]>>;
    };
    mutationKey: unknown[];
    mutationOptions: () => {
      mutationKey: unknown[];
      mutationFn: (input: FnInput<T[K]>) => Promise<FnOutput<T[K]>>;
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
