import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "tsup";
import { IsolatedDecl } from "unplugin-isolated-decl";

export default defineConfig([
  {
    entry: [
      "src/index.ts",
      "src/server.ts",
      "src/client.tsx",
      "src/runtime/server.ts",
      "src/runtime/client.ts",
      "src/runtime/browser.ts",
      "src/runtime/ssr.ts",
      "src/entry/server.tsx",
      "src/entry/ssr.tsx",
      "src/entry/browser.tsx",
      "src/plugin/index.ts",
    ],
    format: ["esm"],
    esbuildPlugins: [
      IsolatedDecl.esbuild({
        transformer: "oxc",
        sourceMap: true,
        rewriteImports(id, importer) {
          return rewriteTypeDeps(id, importer);
        },
      }),
      {
        name: "inline-dep-types",
        setup(build) {
          build.onEnd(() => {
            for (const id in typeDeps) {
              const src = toTypeDepSrc(id);
              const dest = toTypeDepDest(id);
              fs.mkdirSync(path.dirname(dest), { recursive: true });
              fs.copyFileSync(src, dest);
            }
          });
        },
      },
    ],
    esbuildOptions(options) {
      // TODO: workaround for .d.ts.map generation. currently both side don't support it unless `write: true`.
      // https://github.com/egoist/tsup/blob/773d27e6dc9dffc8cab290706ce45d2c7ef09a55/src/plugin.ts#L124
      // https://github.com/unplugin/unplugin-isolated-decl/blob/5c028edebe2790e757b8cfcb2dc1bb9222173d8d/src/index.ts#L408
      options.write = true;
    },
    external: [/^virtual:/, /^@hiogawa\/react-server\//, /^\/dist\//],
  },
]) as any;

const typeDeps: Record<string, string> = {
  "@edge-runtime/cookies": "dist/index.d.ts",
  "@tanstack/history": "dist/esm/index.d.ts",
};

function toTypeDepSrc(id: string) {
  return path.join("node_modules", id, typeDeps[id]!);
}

function toTypeDepDest(id: string) {
  return path.join("dist/types-deps", id, typeDeps[id]!);
}

function rewriteTypeDeps(id: string, importer: string): string | undefined {
  if (id in typeDeps) {
    // TODO: this assumes "src/..." and "dist/..." are at the same level
    return path.relative(path.dirname(importer), stripExt(toTypeDepDest(id)));
  }
  return;
}

// avoid a following error when importing .d.ts
// > A declaration file cannot be imported without 'import type'
function stripExt(filename: string): string {
  return filename.replace(/\.(.?)[jt]sx?$/, "");
}
