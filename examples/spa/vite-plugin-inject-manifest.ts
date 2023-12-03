import fs from "node:fs";
import path from "node:path";
import { tinyassert } from "@hiogawa/utils";
import { type Plugin } from "vite";

// directly expose vite's manifest.json on client for page assets prefetching

export function vitePluginInjectManifest(): Plugin {
  return {
    name: "local:" + vitePluginInjectManifest.name,
    // note that `generateBundle` doesn't include neither `index.html` nor `manifest.json`
    writeBundle: {
      async handler(options, bundle) {
        tinyassert(options.dir);
        const indexHtml = bundle["index.html"];
        const manifestJson = bundle[".vite/manifest.json"];
        tinyassert(indexHtml.type === "asset");
        tinyassert(manifestJson.type === "asset");
        tinyassert(typeof indexHtml.source === "string");
        tinyassert(typeof manifestJson.source === "string");
        const script = `
<script>
window.__viteManifest = ${manifestJson.source};
</script>
`;
        // cf. https://github.com/vitejs/vite/blob/d36d6fb91d50b338f689e6c554e3896b3d739390/packages/vite/src/node/plugins/html.ts#L1115
        const injected = indexHtml.source.replace(
          /([ \t]*)<\/head>/i,
          (match) => `${script}${match}`
        );
        fs.writeFileSync(path.join(options.dir, "index.html"), injected);
      },
    },
  };
}
