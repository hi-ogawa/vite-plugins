declare module "virtual:vite-rsc/ssr-assets" {
  const bootstrapModules: string[];
  export { bootstrapModules };
}

declare module "virtual:vite-rsc/client-references" {
  const default_: Record<string, () => Promise<unknown>>;
  export default default_;
  export const assetDeps:
    | Record<string, import("./plugin").AssetDeps>
    | undefined;
}

declare module "virtual:vite-rsc/server-references" {
  const default_: Record<string, () => Promise<unknown>>;
  export default default_;
}
