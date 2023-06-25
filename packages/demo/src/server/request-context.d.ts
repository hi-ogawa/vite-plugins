import "@hattip/compose";

// extend with custom context
declare module "@hattip/compose" {
  interface Locals {
    queryClient: import("@tanstack/react-query").QueryClient;
  }
}
