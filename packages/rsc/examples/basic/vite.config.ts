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
      entry: "/src/entry-server.tsx",
    }),
    vitePluginRscServer({
      entry: "/src/entry-rsc.tsx",
    }),
  ],
  build: {
    outDir: env.isSsrBuild ? "dist/server" : "dist/client",
  },
}));

//
// render RSC on separate module graph with "react-server" conditions
//

function vitePluginRscServer(options: { entry: string }): Plugin {
  let parentServer: ViteDevServer | undefined;
  let parentEnv: ConfigEnv;
  let rscDevServer: ViteDevServer | undefined;

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
      vitePluginRscUseClient({
        getParentServer: () => parentServer,
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
        Object.assign(globalThis, {
          __devServer: parentServer,
          __rscDevServer: rscDevServer,
        });
      }
      // TODO: rsc build before client and ssr build
      if (parentEnv.command === "build" && !parentEnv.isSsrBuild) {
        await build(rscConfig);
      }
    },
    async buildEnd(_options) {
      if (parentEnv.command === "serve") {
        await rscDevServer?.close();
      }
    },
  };
}

/*
transform file with "use client" directive

[input]
"use client"
export function Counter() {}

[output]
import { createClientReference } from "/src/utils-rsc"
export const Counter = createClientReference("<id>::Counter");
*/
function vitePluginRscUseClient({
  getParentServer,
}: {
  getParentServer: () => ViteDevServer | undefined;
}): Plugin {
  const filter = createFilter(/\.[tj]sx$/);
  const useClientFiles = new Set<string>();

  return {
    name: vitePluginRscUseClient.name,
    async transform(code, id, _options) {
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
      console.log("[rsc-use-client:transform]", { id, exportNames });
      let result = `import { createClientReference } from "/src/utils-rsc";\n`;
      for (const name of exportNames) {
        result += `export const ${name} = createClientReference("${id}::${name}");\n`;
      }
      return result;
    },

    // full-reload client on rsc module change
    handleHotUpdate(ctx) {
      const isRscModule =
        !useClientFiles.has(ctx.file) && ctx.modules.length > 0;
      console.log("[rsc-use-client:handleHotUpdate]", {
        isRscModule,
        file: ctx.file,
      });
      if (isRscModule) {
        getParentServer()?.hot.send({
          type: "full-reload",
          path: ctx.file,
        });
      }
      return ctx.modules;
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
