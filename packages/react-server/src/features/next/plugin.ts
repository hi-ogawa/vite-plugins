import { mkdir, writeFile } from "node:fs/promises";
import type { Rollup } from "vite";

// ensure `.js` extension even if project root is cjs
// https://github.com/vitejs/vite/blob/ec16a5efc04d8ab50301d184c20e7bd0c8d8f6a2/packages/vite/src/node/build.ts#L639
export const OUTPUT_SERVER_JS_EXT = {
  entryFileNames: `[name].js`,
  chunkFileNames: "assets/[name]-[hash].js",
} satisfies Rollup.OutputOptions;

export async function createServerPackageJson() {
  await mkdir("dist", { recursive: true });
  await writeFile("dist/package.json", `{ "type": "module" }`);
}
