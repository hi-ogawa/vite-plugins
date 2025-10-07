// @ts-ignore
import "virtual:react-hmr-preamble";
import "./rpc.client";
import {
  HydrationBoundary,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { App } from "../app";

declare let __query_client_dehydrated_state: any;

async function main() {
  const queryClient = new QueryClient();

  function BrowserRoot() {
    return (
      <QueryClientProvider client={queryClient}>
        <HydrationBoundary state={__query_client_dehydrated_state}>
          <App />
        </HydrationBoundary>
      </QueryClientProvider>
    );
  }

  startTransition(() => {
    hydrateRoot(
      document,
      <StrictMode>
        <BrowserRoot />
      </StrictMode>,
    );
  });
}

main();
