type Assets = import("./shared").ImportAssetsResult;

declare module "*?assets" {
  const assets: Assets;
  export default assets;
}

declare module "*?assets=client" {
  const assets: Assets;
  export default assets;
}

declare module "*?assets=ssr" {
  const assets: Assets;
  export default assets;
}
