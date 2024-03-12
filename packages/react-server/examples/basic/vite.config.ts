import fs from "node:fs";
import path from "node:path";
import { tinyassert } from "@hiogawa/utils";
import { vitePluginSsrMiddleware } from "@hiogawa/vite-plugin-ssr-middleware";
import react from "@vitejs/plugin-react";
import type { Program } from "estree";
import {
  type ConfigEnv,
  type InlineConfig,
  type Plugin,
  type ViteDevServer,
  build,
  createFilter,
  createServer,
  defineConfig,
  parseAstAsync,
} from "vite";

export default defineConfig((env) => ({
  clearScreen: false,
  plugins: [
    react(),
    vitePluginSsrMiddleware({
      entry: process.env["SSR_ENTRY"] || "/src/adapters/node.ts",
    }),
    vitePluginRscServer({
      entry: "/src/entry-rsc.tsx",
    }),
    vitePluginUseServer(),
    {
      name: "preview-ssr-middleware",
      async configurePreviewServer(server) {
        // "slice" to avoid esbuild crash when transpiling vite.config.ts
        const mod = await import("./dist/server/index.js".slice());
        return () => server.middlewares.use(mod.default);
      },
    },
  ],
  build: {
    outDir: env.isSsrBuild ? "dist/server" : "dist/client",
  },
}));

//
// render RSC on separate module graph with "react-server" conditions
//

// convenient singleton to track file ids to decide RSC hot reload
class RscManager {
  // all files in parent server
  parentIds = new Set<string>();
  // all files in rsc server
  rscIds = new Set<string>();
  // "use client" files in rsc server
  rscUseClientIds = new Set<string>();

  shouldReloadRsc(id: string) {
    console.log("[RscManager.shouldReloadRsc]", [
      this.parentIds.has(id),
      this.rscIds.has(id),
      this.rscUseClientIds.has(id),
      id,
    ]);
    return this.rscIds.has(id) && !this.rscUseClientIds.has(id);
  }
}

function vitePluginRscServer(options: { entry: string }): Plugin {
  let parentServer: ViteDevServer | undefined;
  let parentEnv: ConfigEnv;
  let rscDevServer: ViteDevServer | undefined;
  let manager = new RscManager();

  const rscConfig: InlineConfig = {
    // TODO: custom logger to distinct two server logs easily?
    // customLogger: undefined,
    clearScreen: false,
    configFile: false,
    cacheDir: "./node_modules/.vite-rsc",
    optimizeDeps: {
      noDiscovery: true,
      include: [],
    },
    ssr: {
      resolve: {
        conditions: ["react-server"],
      },
      // no external to ensure loading all deps with react-server condition
      noExternal: true,
      // pre-bundle cjs deps
      optimizeDeps: {
        include: [
          "react",
          "react/jsx-dev-runtime",
          "react-server-dom-webpack/server.edge",
        ],
      },
    },
    plugins: [
      // TODO: expose server reference for RSC itself
      // vitePluginUseServer(),

      // expose "use server" files for RSC build via virtual module
      {
        name: "virtual-rsc-use-server",
        apply: "build",
        resolveId(source, _importer, _options) {
          if (source === "virtual:rsc-use-server") {
            return "\0" + source;
          }
          return;
        },
        async load(id, _options) {
          if (id === "\0virtual:rsc-use-server") {
            // TODO: crawl file system?
            const files = ["/src/routes/test/action/action.tsx"];
            let result = `export default {\n`;
            for (const file of files) {
              const resolved = await this.resolve(file);
              tinyassert(resolved);
              const id = resolved.id;
              result += `"${id}": () => import("${id}"),\n`;
            }
            result += "};\n";
            return result;
          }
          return;
        },
      },

      // transform "use client" into client referecnes
      vitePluginRscUseClient({
        manager,
      }),
    ],
    build: {
      ssr: true,
      outDir: "dist/rsc",
      rollupOptions: {
        input: {
          index: options.entry,
        },
      },
    },
  };

  return {
    name: vitePluginRscServer.name,
    config(_config, env) {
      parentEnv = env;
    },
    async configureServer(server) {
      parentServer = server;
    },
    async buildStart(_options) {
      if (parentEnv.command === "serve") {
        rscDevServer = await createServer(rscConfig);
        rscDevServer.pluginContainer.buildStart({});
        Object.assign(globalThis, {
          __devServer: parentServer,
          __rscDevServer: rscDevServer,
        });
      }
      if (parentEnv.command === "build" && !parentEnv.isSsrBuild) {
        await build(rscConfig);
      }
    },
    async buildEnd(_options) {
      if (parentEnv.command === "serve") {
        await rscDevServer?.close();
      }
    },
    transform(_code, id, _options) {
      if (!id.includes("/node_modules/")) {
        manager.parentIds.add(id);
      }
    },
    async handleHotUpdate(ctx) {
      tinyassert(parentServer);

      // re-render RSC with custom event
      if (ctx.modules.every((m) => m.id && manager.shouldReloadRsc(m.id))) {
        parentServer.hot.send({
          type: "custom",
          event: "rsc:update",
          data: {
            file: ctx.file,
          },
        });

        // Some rsc files are included in parent module graph
        // due to postcss creating dependency from style.css to all source files.
        // In this case, reload all importers (for css hmr),
        // and return empty modules to avoid full-reload
        if (ctx.modules.every((m) => m.id && !manager.parentIds.has(m.id))) {
          // in this case
          for (const m of ctx.modules) {
            for (const imod of m.importers) {
              await parentServer.reloadModule(imod);
            }
          }
          return [];
        }
      }
      return ctx.modules;
    },
    resolveId(source, _importer, _options) {
      // weird trick to silence import analysis error during dev
      // by pointing to a file which always exists
      if (
        parentEnv.command === "serve" &&
        source === "/dist/rsc/client-references.js"
      ) {
        return "/package.json";
      }
      return;
    },
  };
}

/*
transform "use client" directive

[input]
"use client"
export function Counter() {}

[output (rsc)]
import { createClientReference } from "/src/runtime/rsc"
export const Counter = createClientReference("<id>::Counter");
*/
function vitePluginRscUseClient({ manager }: { manager: RscManager }): Plugin {
  const filter = createFilter(/\.[tj]sx$/);
  const useClientFiles = manager.rscUseClientIds;

  return {
    name: vitePluginRscUseClient.name,
    async transform(code, id, _options) {
      manager.rscIds.add(id);
      if (!filter(id)) {
        useClientFiles.delete(id);
        return;
      }
      const ast: Program = await parseAstAsync(code);
      const hasUseClient = ast.body.some(
        (node) =>
          node.type === "ExpressionStatement" &&
          "directive" in node &&
          node.directive === "use client"
      );
      if (!hasUseClient) {
        useClientFiles.delete(id);
        return;
      }
      useClientFiles.add(id);
      // for now only handle simple exports
      //   export function foo() {}
      //   export const foo = () => {}
      // cf. https://github.com/hi-ogawa/vite-plugins/blob/aed20d88ae4b1582701795e2079a96d7caeccf89/packages/vite-plugin-simple-hmr/src/transform.ts#L73
      const exportNames: string[] = [];
      for (const node of ast.body) {
        if (node.type === "ExportNamedDeclaration") {
          if (node.declaration) {
            if (node.declaration.type === "FunctionDeclaration") {
              exportNames.push(node.declaration.id.name);
            }
            if (node.declaration.type === "VariableDeclaration") {
              for (const decl of node.declaration.declarations) {
                if (decl.id.type === "Identifier") {
                  exportNames.push(decl.id.name);
                }
              }
            }
          }
        }
      }
      // TODO: obfuscate "id" for production?
      console.log("[rsc-use-client:transform]", { id, exportNames });
      let result = `import { createClientReference } from "/src/lib/rsc";\n`;
      for (const name of exportNames) {
        result += `export const ${name} = createClientReference("${id}::${name}");\n`;
      }
      return result;
    },

    /**
     * emit client-references as dynamic import map
     * TODO: re-export only used exports?
     *
     * export default {
     *   "some-file1": () => import("some-file1"),
     * }
     */
    writeBundle: {
      async handler(options, _bundle) {
        let result = `export default {\n`;
        for (const file of useClientFiles) {
          result += `"${file}": () => import("${file}"),\n`;
        }
        result += "};\n";
        tinyassert(options.dir);
        await fs.promises.writeFile(
          path.join(options.dir, "client-references.js"),
          result
        );
      },
    },
  };
}

/*
transform "use server" directive
TODO: include all "use server" files for rsc build

[input]
"use server"
export function hello() {}

[output] (client / ssr)
import { createServerReference } from "/src/runtime/shared"
export const hello = createServerReference("<id>::hello");
*/
function vitePluginUseServer(): Plugin {
  const filter = createFilter(/\.[tj]sx?$/);

  return {
    name: vitePluginRscUseClient.name,
    async transform(code, id, _options) {
      if (!filter(id)) {
        return;
      }
      const ast: Program = await parseAstAsync(code);
      const hasDirective = ast.body.some(
        (node) =>
          node.type === "ExpressionStatement" &&
          "directive" in node &&
          node.directive === "use server"
      );
      if (!hasDirective) {
        return;
      }
      const exportNames: string[] = [];
      for (const node of ast.body) {
        if (node.type === "ExportNamedDeclaration") {
          if (node.declaration) {
            if (node.declaration.type === "FunctionDeclaration") {
              exportNames.push(node.declaration.id.name);
            }
            if (node.declaration.type === "VariableDeclaration") {
              for (const decl of node.declaration.declarations) {
                if (decl.id.type === "Identifier") {
                  exportNames.push(decl.id.name);
                }
              }
            }
          }
        }
      }
      console.log("[rsc-use-server:transform]", { id, exportNames });
      let result = `import { createServerReference } from "/src/lib/shared";\n`;
      for (const name of exportNames) {
        result += `export const ${name} = createServerReference("${id}::${name}");\n`;
      }
      return result;
    },
  };
}
