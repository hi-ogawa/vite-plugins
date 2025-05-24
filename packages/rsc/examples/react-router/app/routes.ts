import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("about", "routes/about.tsx"),
  route("optimistic", "routes/optimistic/route.tsx"),
  route("server-loader", "routes/server-loader/route.tsx"),
  route("client-loader", "routes/client-loader/route.tsx"),
  route("client-loader-hydrate", "routes/client-loader-hydrate/route.tsx"),
  route(
    "client-loader-without-server-loader",
    "routes/client-loader-without-server-loader/route.tsx",
  ),
] satisfies RouteConfig;
