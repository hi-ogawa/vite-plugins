import { arrayToEnum } from "@hiogawa/utils";

// url param for server to tell loader request routeId cf. https://github.com/remix-run/remix/blob/c858f53e5a67fb293baf79a8de00c418903bc250/packages/remix-react/routes.tsx#L210
// this convention might not be DX friendly since request path doesn't tell which loader is called exactly
export const LOADER_ROUTE_ID_PARAM = "loader-router-id";

export const LOADER_HEADERS = arrayToEnum([
  // redirect response
  "location",
  "x-loader-redirect-url",
  "x-loader-redirect-status",

  // error `Response`
  "x-loader-error-response", // aka x-remix-catch

  // exception (runtime server `Error` propagated to client)
  "x-loader-exception", // aka x-remix-error

  "x-loader-response", // x-remix-response https://github.com/remix-run/remix/pull/6783
]);
