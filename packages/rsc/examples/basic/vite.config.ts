import { vitePluginSsrMiddleware } from "@hiogawa/vite-plugin-ssr-middleware";
import {
  type Plugin,
  type ViteDevServer,
  createServer,
  defineConfig,
} from "vite";

export default defineConfig({
  clearScreen: false,
  plugins: [
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
      configFile: false,
      envFile: false,
      cacheDir: "./node_modules/.vite-rsc",
      ssr: {
        resolve: {
          conditions: ["react-server"],
        },

        // no external to ensure loading everything with react-server condition
        noExternal: true,
        // noExternal: ["react", "react-server-dom-webpack"],

        optimizeDeps: {
          // pre-bundle cjs deps
          include: [
            "react",
            "react/jsx-dev-runtime",
            // "react-dom",
            // "react-dom/server.edge",
            // "react-server-dom-webpack/client.edge",
            "react-server-dom-webpack/server.edge",
          ],
        },
      },
    });
    await this.server.pluginContainer.buildStart({});
  }

  async render() {
    console.log("[RscServer] close");
    const mod: any = await this.server.ssrLoadModule(this.options.entry);
    const rscStream = await mod.default();
    return rscStream;
  }

  async close() {
    console.log("[RscServer] close");
    await this.server.close();
  }
}
