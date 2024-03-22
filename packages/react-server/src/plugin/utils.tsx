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

// TODO: configurable?
export const ENTRY_CLIENT = "/src/entry-client";
export const ENTRY_REACT_SERVER = "/src/entry-react-server";
export const ENTRY_CLIENT_WRAPPER = "virtual:entry-client-wrapper";
export const ENTRY_REACT_SERVER_WRAPPER = "virtual:entry-react-server-wrapper";
