import { createServer } from "vite";
import { vitePluginViteNodeMiniflare } from "../dist/index.js";

async function main() {
  const viteDevServer = await createServer({
    clearScreen: false,
    configFile: false,
    ssr: {
      noExternal: true,
    },
    server: {
      hmr: true,
    },
    plugins: [vitePluginViteNodeMiniflare({ entry: "/demo/server.ts" })],
  });
  await viteDevServer.listen();
  viteDevServer.printUrls();
}

main();
