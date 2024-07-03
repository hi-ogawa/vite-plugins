import { existsSync, readFileSync } from "fs";
import path from "path";
import type { Plugin } from "vite";
import type { PluginStateManager } from "../../plugin";
import { createVirtualPlugin } from "../../plugin/utils";

// for now support only app/favicon.ico
// https://nextjs.org/docs/app/api-reference/file-conventions/metadata/app-icons#favicon

export type MetadataFilesExports = {
  favicon: boolean;
};

export function metadataFilePluginServer({
  routeDir,
}: { routeDir: string }): Plugin[] {
  const faviconPath = path.resolve(routeDir, "favicon.ico");

  return [
    createVirtualPlugin("metadata-files", function () {
      this.addWatchFile(faviconPath);
      const data: MetadataFilesExports = {
        favicon: existsSync(faviconPath),
      };
      return `export default ${JSON.stringify(data)}`;
    }),
  ];
}

export function metadataFilePluginClient({
  routeDir,
  manager,
}: { routeDir: string; manager: PluginStateManager }): Plugin {
  const faviconPath = `${routeDir}/favicon.ico`;

  return {
    name: metadataFilePluginClient.name,
    configureServer(server) {
      // rewrite and let vite serve the assets
      server.middlewares.use((req, _res, next) => {
        const url = new URL(req.url || "", "https://tmp.local");
        if (url.pathname === "/favicon.ico" && existsSync(faviconPath)) {
          req.url = `/${faviconPath}`;
        }
        next();
      });
    },
    buildEnd() {
      if (manager.buildType === "client" && existsSync(faviconPath)) {
        this.emitFile({
          type: "asset",
          fileName: "favicon.ico",
          source: readFileSync(faviconPath),
        });
      }
    },
  };
}
