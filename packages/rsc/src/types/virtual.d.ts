declare module "virtual:vite-rsc/assets-manifest" {
  export const entryAssets: import("../plugin").AssetDeps;
  export const clientReferenceDeps: Record<
    string,
    import("../plugin").AssetDeps
  >;
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
