import fs from "node:fs";
import { defineConfig } from "tsdown";
import pkg from "./package.json" with { type: "json" };

export default defineConfig({
  entry: [
    "src/plugin.ts",
    "src/browser.ts",
    "src/ssr.tsx",
    "src/rsc.tsx",
    "src/vite-utils.ts",
    "src/core/browser.ts",
    "src/core/ssr.ts",
    "src/core/rsc.ts",
    "src/core/plugin.ts",
    "src/react/browser.ts",
    "src/react/ssr.ts",
    "src/react/rsc.ts",
    "src/extra/browser.tsx",
    "src/extra/ssr.tsx",
    "src/extra/rsc.tsx",
  ],
  format: ["esm"],
  external: [/^virtual:/, new RegExp(`^${pkg.name}/`)],
  dts: {
    sourceMap: process.argv.slice(2).includes("--sourcemap"),
  },
  bundleDts: false,
  plugins: [
    {
      name: "vendor",
      buildStart() {
        fs.rmSync("./dist/vendor/", { recursive: true, force: true });
        fs.mkdirSync("./dist/vendor", { recursive: true });
        fs.cpSync(
          "./node_modules/react-server-dom-vite",
          "./dist/vendor/react-server-dom-vite",
          { recursive: true, dereference: true },
        );
        fs.rmSync("./dist/vendor/react-server-dom-vite/node_modules", {
          recursive: true,
          force: true,
        });
      },
      transform(code) {
        // TODO: don't be lazy and just update code?
        if (code.includes(`"react-server-dom-vite/`)) {
          code = code.replace(
            /"react-server-dom-vite\/([^"]*)"/g,
            (m) => `"@hiogawa/vite-rsc/vendor/${m.slice(1, -1)}"`,
          );
          return code;
        }
      },
    },
  ],
}) as any;
