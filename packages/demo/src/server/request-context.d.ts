import "@hattip/compose";
import "react-router-dom";

// provide access to QueryClient during request lifecycle

declare module "@hattip/compose" {
  interface RequestContextExtensions {
    queryClient: import("@tanstack/react-query").QueryClient;
    rpcCaller: import("../tinyrpc/server").RpcProxy;
    rpcQuery: import("../tinyrpc/server").RpcQuery;
  }
}

declare module "react-router-dom" {
  interface LoaderFunctionArgs {
    context: import("@hattip/compose").RequestContext;
  }
}
