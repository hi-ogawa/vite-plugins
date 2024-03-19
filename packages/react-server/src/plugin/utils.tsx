import type { ViteDevServer } from "vite";

export function invalidateModule(server: ViteDevServer, id: string) {
  const mod = server.moduleGraph.getModuleById(id);
  if (mod) {
    server.moduleGraph.invalidateModule(mod);
  }
}

export interface SsrAssetsType {
  bootstrapModules: string[];
  head: string;
}
