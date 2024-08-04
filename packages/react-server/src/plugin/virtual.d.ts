declare module "virtual:server-routes" {
  const $default: Record<string, any>;
  export default $default;

  export const middleware:
    | import("../features/next/middleware").MiddlewareModule
    | undefined;
}

declare module "virtual:client-routes" {
  export const globalError: React.FC | undefined;
}
