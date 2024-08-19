import type * as esbuild from "esbuild";

// cf. https://github.com/hi-ogawa/vite-plugins/blob/998561660c8a27e067e976d4ede9dca53984d41a/packages/pre-bundle-new-url/src/index.ts#L26
export function esbuildPluginAssetImportMetaUrl(): esbuild.Plugin {
  return {
    name: esbuildPluginAssetImportMetaUrl.name,
    setup(build) {
      build;
    },
  };
}
