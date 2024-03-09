import { vitePluginSsrMiddleware } from "@hiogawa/vite-plugin-ssr-middleware";
import react from "@vitejs/plugin-react";
import {
  type ConfigEnv,
  type InlineConfig,
  type Plugin,
  type ResolvedConfig,
  type ViteDevServer,
  build,
  createFilter,
  createServer,
  defineConfig,
  parseAstAsync,
} from "vite";
import type { RenderRsc } from "./src/entry-rsc";

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
  let parent: ViteDevServer | undefined;
  let parentEnv: ConfigEnv;
  let parentConfig: ResolvedConfig;
  let rscServer: RscServer;

  return {
    name: vitePluginRscServer.name,
    config(_config, env) {
      parentEnv = env;
    },
    configResolved(config) {
      parentConfig = config;
    },
    async configureServer(server) {
      parent = server;
    },
    async buildStart(_options) {
      rscServer = new RscServer(options, parentConfig, parent);
      if (parentEnv.command === "serve") {
        await rscServer.createServer();
        Object.assign(globalThis, { __rscServer: rscServer });
      }
      // TODO: rsc build before client and ssr build
      if (parentEnv.command === "build" && !parentEnv.isSsrBuild) {
        await rscServer.build();
      }
    },
    async buildEnd(_options) {
      if (parentEnv.command === "serve") {
        await rscServer.close();
      }
    },
  };
}

export class RscServer {
  server!: ViteDevServer;

  constructor(
    private options: {
      entry: string;
    },
    public parentConfig: ResolvedConfig,
    public parentServer?: ViteDevServer
  ) {}

  getViteConfig(): InlineConfig {
    return {
      // TODO: custom logger to distinct two server logs easily
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
      plugins: [vitePluginRscUseClient({ rscServer: this })],
      build: {
        ssr: true,
        outDir: "dist/rsc",
        rollupOptions: {
          input: {
            index: this.options.entry,
          },
        },
      },
    };
  }

  async createServer() {
    console.log("[RscServer] createServer");
    this.server = await createServer(this.getViteConfig());
  }

  async build() {
    console.log("[RscServer] build");
    await build(this.getViteConfig());
  }

  async render() {
    console.log("[RscServer] render");
    const mod: any = await this.server.ssrLoadModule(this.options.entry);
    const rscStream = (mod.default as RenderRsc)();
    return rscStream;
  }

  async close() {
    console.log("[RscServer] close");
    await this.server.close();
  }
}

/*

[input]

"use client"
export function Counter() {}

[output]

import { createClientReference } from "/src/utils-rsc"
export const Counter = createClientReference("<id>::Counter");

 */
function vitePluginRscUseClient({
  rscServer,
}: {
  rscServer: RscServer;
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
      const ast = await parseAstAsync(code);
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
      console.log("[rsc-use-client:handleHotUpdate]", [isRscModule, ctx.file]);
      if (isRscModule) {
        rscServer.parentServer?.hot.send({
          type: "full-reload",
          path: ctx.file,
        });
      }
      return ctx.modules;
    },
  };
}
