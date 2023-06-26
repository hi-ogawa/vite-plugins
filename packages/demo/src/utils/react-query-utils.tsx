import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
  dehydrate,
  hydrate,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import React from "react";
import { toast } from "react-hot-toast";

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        retry: 0,
      },
      mutations: {
        onError: (error) => {
          console.error("mutation error", error);
          toast.error("something went wrong...");
        },
      },
    },
    queryCache: new QueryCache({
      onError: (error) => {
        console.error("query error", error);
        toast.error("something went wrong...");
      },
    }),
  });
}

export const __QUERY_CLIENT_STATE = "__QUERY_CLIENT_STATE";

// client
export function createQueryClientWithState() {
  const queryClient = createQueryClient();
  hydrate(queryClient, (window as any)[__QUERY_CLIENT_STATE]);
  return queryClient;
}

// server
export function getQueryClientStateScript(queryClient: QueryClient) {
  const queryClientState = dehydrate(queryClient);
  return `
    <script>
      globalThis.${__QUERY_CLIENT_STATE} = ${JSON.stringify(queryClientState)}
    </script>
  `;
}

export function ReactQueryWrapper(
  props: React.PropsWithChildren<{ queryClient: QueryClient }>
) {
  return (
    <QueryClientProvider client={props.queryClient}>
      {props.children}
      {import.meta.env.DEV && <ReactQueryDevtools />}
    </QueryClientProvider>
  );
}
