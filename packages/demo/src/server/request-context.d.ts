import "@hattip/compose";

// extend with custom context
declare module "@hattip/compose" {
  interface Locals {
    queryClient: any;
  }
}
