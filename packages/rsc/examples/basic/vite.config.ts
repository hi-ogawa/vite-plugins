import { vitePluginSsrMiddleware } from "@hiogawa/vite-plugin-ssr-middleware";
import {
  type Plugin,
  type ViteDevServer,
  createFilter,
  createServer,
  defineConfig,
  parseAstAsync,
} from "vite";
import type { RenderRsc } from "./src/entry-rsc";
// import react from "@vitejs/plugin-react";

export default defineConfig({
  clearScreen: false,
  plugins: [
    // TODO: preamble
    // react(),

    vitePluginSsrMiddleware({
      entry: "/src/entry-server.tsx",
    }),
    vitePluginRscServer({
      entry: "/src/entry-rsc.tsx",
    }),
  ],
});

//
// render RSC on separate module graph with "react-server" conditions
//

function vitePluginRscServer(options: { entry: string }): Plugin {
  let rscServer: RscServer | undefined;
  return {
    name: "rsc-server",
    async buildStart(_options) {
      await rscServer?.close();
      rscServer = new RscServer(options);
      await rscServer.setup();
      Object.assign(globalThis, { __rscServer: rscServer });
    },
    async buildEnd(_options) {
      await rscServer?.close();
      rscServer = undefined;
    },
  };
}

export class RscServer {
  server!: ViteDevServer;

  constructor(
    private options: {
      entry: string;
    }
  ) {}

  async setup() {
    console.log("[RscServer] setup");
    this.server = await createServer({
      clearScreen: false,
      configFile: false,
      envFile: false,
      cacheDir: "./node_modules/.vite-rsc",
      ssr: {
        resolve: {
          conditions: ["react-server"],
        },

        // no external to ensure loading all deps with react-server condition
        // TODO: just spawn worker?
        noExternal: true,
        // noExternal: ["react", "react-server-dom-webpack"]

        optimizeDeps: {
          // pre-bundle cjs deps
          include: [
            "react",
            "react/jsx-dev-runtime",
            "react-server-dom-webpack/server.edge",
          ],
        },
      },
      plugins: [vitePluginRscUseClient()],
    });
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
function vitePluginRscUseClient(): Plugin {
  const filter = createFilter(/\.[tj]sx$/);
  return {
    name: "rsc-server",
    async transform(code, id, _options) {
      if (!filter(id)) {
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
        return;
      }
      let result = `
        import { createClientReference } from "/src/utils-rsc";
      `;
      for (const node of ast.body) {
        // for now only handle this case
        //   export function foo() {}
        if (node.type === "ExportNamedDeclaration") {
          if (node.declaration) {
            if (node.declaration.type === "FunctionDeclaration") {
              const name = node.declaration.id.name;
              result += `
                export const ${name} = createClientReference("${id}::${name}");
              `;
            }
          }
        }
      }
      return result;
    },
  };
}
