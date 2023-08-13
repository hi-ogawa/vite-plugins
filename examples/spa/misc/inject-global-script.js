import process from "node:process";
import fs from "node:fs";

// for example, this allows exposing vite manifest.json to client,
// which is probably not possible to do via vite plugin.

// usage:
// node ./misc/inject-global-script.js dist/client/index.html dist/client/manifest.json __viteManifest

function main() {
  const [htmlPath, injecteePath, injecteeName] = process.argv.slice(2);
  let html = fs.readFileSync(htmlPath, "utf-8");
  const injectee = fs.readFileSync(injecteePath, "utf-8");
  // TODO: escape?
  const script = `
<script>
window.${injecteeName} = ${injectee};
</script>
`;
  // cf. https://github.com/vitejs/vite/blob/d36d6fb91d50b338f689e6c554e3896b3d739390/packages/vite/src/node/plugins/html.ts#L1115
  html = html.replace(/([ \t]*)<\/head>/i, (match) => `${script}${match}`);
  fs.writeFileSync(htmlPath, html);
}

main();
