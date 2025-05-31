declare module "virtual:vite-rsc/prepare-destination-manifest" {
  const default_: Record<string, string[]>;
  export default default_;
}

declare module "virtual:vite-rsc/client-references" {
  const default_: Record<string, () => Promise<unknown>>;
  export default default_;
}

declare module "virtual:vite-rsc/server-references" {
  const default_: Record<string, () => Promise<unknown>>;
  export default default_;
}
