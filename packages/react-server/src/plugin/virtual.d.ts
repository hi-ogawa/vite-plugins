declare module "virtual:server-routes" {
  const $default: Record<string, any>;
  export default $default;

  export const globalError: React.Component | undefined;

  export const middleware:
    | import("../features/next/middleware").MiddlewareModule
    | undefined;
}
