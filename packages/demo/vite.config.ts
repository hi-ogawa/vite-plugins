import process from "node:process";
import globRoutesPlugin from "@hiogawa/vite-glob-routes";
import { importDevServerPlugin } from "@hiogawa/vite-import-dev-server";
import vaviteConnect from "@vavite/connect";
import react from "@vitejs/plugin-react";
import unocss from "unocss/vite";
import { FilterPattern, type Plugin, createFilter, defineConfig } from "vite";

export default defineConfig((ctx) => ({
  plugins: [
    react(),
    unocss(),
    importDevServerPlugin(),
    globRoutesPlugin({ root: "/src/routes" }),
    vaviteConnect({
      standalone: false,
      serveClientAssetsInDev: true,
      handlerEntry:
        process.env["SERVER_ENTRY"] ?? "./src/server/adapter-connect.ts",
    }),
    viteEmptifyModulePlugin(),
  ],
  build: {
    outDir: ctx.ssrBuild ? "dist/server" : "dist/client",
    manifest: true,
    sourcemap: true,
  },
  server: process.env["PORT"]
    ? {
        port: Number(process.env["PORT"]),
        strictPort: true,
      }
    : undefined,
  clearScreen: false,
}));

// similar to https://github.com/remix-run/remix/blob/80c6842f547b7e83b58f1963894b07ad18c2dfe2/packages/remix-dev/compiler/plugins/emptyModules.ts#L10
// but for vite, we needs to fake esm exports so we use es-module-lexer to extract export names.
function viteEmptifyModulePlugin(pluginOptions?: {
  clientOnly?: FilterPattern;
  serverOnly?: FilterPattern;
  exclude?: FilterPattern;
}): Plugin {
  const exclude = pluginOptions?.exclude ?? ["**/node_modules/**"];
  const serverOnly = createFilter(
    pluginOptions?.serverOnly ?? ["**/server/**", "**/*.server.*"],
    exclude
  );
  const clientOnly = createFilter(
    pluginOptions?.clientOnly ?? ["**/client/**", "**/*.client.*"],
    exclude
  );
  return {
    name: viteEmptifyModulePlugin.name,
    enforce: "pre",
    async transform(code, id, options) {
      if (options?.ssr ? clientOnly(id) : serverOnly(id)) {
        const lib = await import("es-module-lexer");
        await lib.init;
        const [_import, exports] = lib.parse(code);
        return exports
          .map((e) =>
            e.n === "default" ? `export default {}` : `export var ${e.n} = {}`
          )
          .join("\n");
      }
      return undefined;
    },
  };
}
