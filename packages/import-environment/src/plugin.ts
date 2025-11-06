import assert from "node:assert";
import path from "node:path";
import MagicString from "magic-string";
import { stripLiteral } from "strip-literal";
import { type Plugin, type ResolvedConfig, type ViteDevServer } from "vite";
import { getEntrySource, normalizeRelativePath } from "./utils";
import { evalValue } from "./vite-utils";

export default function vitePluginImportEnvironment(_pluginOpts?: {}): Plugin[] {
  let server: ViteDevServer;
  let resolvedConfig: ResolvedConfig;
  return [
    {
      // allow loading entry module in other environment by
      // - (dev) rewriting to `server.environments[<env>].runner.import(<entry>)`
      // - (build) rewriting to external `import("../<env>/<entry>.js")`
      name: "rsc:load-environment-module",
      configResolved(config) {
        resolvedConfig = config;
      },
      configureServer(server_) {
        server = server_;
      },
      async transform(code) {
        if (!code.includes("import.meta.viteRsc.loadModule")) return;
        const s = new MagicString(code);
        for (const match of stripLiteral(code).matchAll(
          /import\.meta\.viteRsc\.loadModule\(([\s\S]*?)\)/dg,
        )) {
          const [argStart, argEnd] = match.indices![1]!;
          const argCode = code.slice(argStart, argEnd).trim();
          const [environmentName, entryName] = evalValue(`[${argCode}]`);
          let replacement: string;
          if (this.environment.mode === "dev") {
            const environment = server.environments[environmentName]!;
            const source = getEntrySource(environment.config, entryName);
            const resolved =
              await environment.pluginContainer.resolveId(source);
            assert(resolved, `[vite-rsc] failed to resolve entry '${source}'`);
            replacement =
              `globalThis.__viteRscDevServer.environments[${JSON.stringify(
                environmentName,
              )}]` + `.runner.import(${JSON.stringify(resolved.id)})`;
          } else {
            replacement = JSON.stringify(
              `__vite_rsc_load_module:${this.environment.name}:${environmentName}:${entryName}`,
            );
          }
          const [start, end] = match.indices![0]!;
          s.overwrite(start, end, replacement);
        }
        if (s.hasChanged()) {
          return {
            code: s.toString(),
            map: s.generateMap({ hires: "boundary" }),
          };
        }
      },
      renderChunk(code, chunk) {
        if (!code.includes("__vite_rsc_load_module")) return;
        const s = new MagicString(code);
        for (const match of code.matchAll(
          /['"]__vite_rsc_load_module:(\w+):(\w+):(\w+)['"]/dg,
        )) {
          const [fromEnv, toEnv, entryName] = match.slice(1);
          const importPath = normalizeRelativePath(
            path.relative(
              path.join(
                resolvedConfig.environments[fromEnv!]!.build.outDir,
                chunk.fileName,
                "..",
              ),
              path.join(
                resolvedConfig.environments[toEnv!]!.build.outDir,
                // TODO: this breaks when custom entyFileNames
                `${entryName}.js`,
              ),
            ),
          );
          const replacement = `(import(${JSON.stringify(importPath)}))`;
          const [start, end] = match.indices![0]!;
          s.overwrite(start, end, replacement);
        }
        if (s.hasChanged()) {
          return {
            code: s.toString(),
            map: s.generateMap({ hires: "boundary" }),
          };
        }
      },
    },
  ];
}
