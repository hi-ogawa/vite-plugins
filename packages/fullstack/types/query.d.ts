type Default = import("./shared").ImportAssetsResult;

declare module "*?assets" {
  const default_: Default;
  export default result;
}

declare module "*?assets=client" {
  const default_: Default;
  export default result;
}

declare module "*?assets=ssr" {
  const default_: Default;
  export default result;
}
