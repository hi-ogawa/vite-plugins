// @ts-ignore
import "virtual:react-hmr-preamble";
import "./rpc.client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { App } from "../app";

async function main() {
  const queryClient = new QueryClient();

  function BrowserRoot() {
    return (
      <QueryClientProvider client={queryClient}>
        <App />
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
