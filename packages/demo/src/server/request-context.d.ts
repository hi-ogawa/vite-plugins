import "@hattip/compose";
import "react-router-dom";

// provide access to QueryClient during request lifecycle

declare module "@hattip/compose" {
  interface RequestContextExtensions {
    queryClient: import("@tanstack/react-query").QueryClient;
  }
}

declare module "react-router-dom" {
  interface LoaderFunctionArgs {
    context: import("@hattip/compose").RequestContext;
  }
}
