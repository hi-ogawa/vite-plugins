import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import React from "react";
import { toast } from "./toast";

function createQueryClient() {
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

export function ReactQueryWrapper(props: React.PropsWithChildren) {
  const [queryClient] = React.useState(() => createQueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      {props.children}
      {import.meta.env.DEV && <ReactQueryDevtools />}
    </QueryClientProvider>
  );
}
