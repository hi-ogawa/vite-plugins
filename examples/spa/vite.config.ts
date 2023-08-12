import process from "node:process";
import globRoutesPlugin from "@hiogawa/vite-glob-routes";
import react from "@vitejs/plugin-react";
import { PluginOption, createFilter, defineConfig } from "vite";

export default defineConfig({
  plugins: [
    reactRefreshSkipPlugin(),
    react(),
    globRoutesPlugin({ root: "/src/routes" }),
  ],
  build: {
    outDir: "dist/client",
    manifest: true,
    sourcemap: true,
  },
  server: process.env["PORT"]
    ? {
        port: Number(process.env["PORT"]),
        strictPort: true,
      }
    : undefined,
  preview: process.env["PORT"]
    ? {
        port: Number(process.env["PORT"]),
        strictPort: true,
      }
    : undefined,
  clearScreen: false,
});

/*
quick-dirty plugin to mutate Function.name to cheat react-refresh
- https://github.com/facebook/react/blob/4e3618ae41669c95a3377ae615c727f74f89d141/packages/react-refresh/src/ReactFreshRuntime.js#L713-L715
- https://github.com/vitejs/vite-plugin-react/blob/4bebe5bd7c0267f6b088005293870cf69953b73a/packages/plugin-react/src/refreshUtils.js#L38

note that when modifying skipped function, the page won't refreshed automatically
and thus it will require manual reload to update "loader" for example.

we could introduce `*.page.client.ts` convention to separate `loader` exports but that DX feels also clumsy,

## what it does

find a following comment in the source code

// @x-refresh-skip loader

then add this code in the footer

Object.defineProperty(loader, "name", { value: "XRefreshSkip_loader" })
*/
function reactRefreshSkipPlugin(): PluginOption {
  const filter = createFilter(/\.[tj]sx?$/);

  return {
    name: "local:" + reactRefreshSkipPlugin.name,
    apply: "serve",
    enforce: "pre",
    transform(code, id, _options) {
      if (!filter(id)) {
        return;
      }

      const match = code.match(/^\/\/ @x-refresh-skip (.*)$/m);
      if (!match || !match[1]) {
        return;
      }

      const skipList = match[1]
        .split(", ")
        .map((v) => v.trim())
        .filter(Boolean);
      const patch = skipList.map(
        (name) =>
          `Object.defineProperty(${name}, "name", { value: "XRefreshSkip_${name}" });\n`
      );
      return { code: code + patch };
    },
  };
}
