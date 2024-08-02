declare module "virtual:server-routes" {
  const $default: Record<string, any>;
  export default $default;

  export const middleware:
    | import("../features/next/middleware").MiddlewareModule
    | undefined;
}

declare module "virtual:import-react-server" {
  export const { handler, router }: typeof import("../entry/server");
}
