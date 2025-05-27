import nodeCrypto from "node:crypto";
import type { Plugin, ViteDevServer } from "vite";

export const applyPluginToServer: Plugin["applyToEnvironment"] = (env) =>
  env.name === "rsc";
export const applyPluginToClient: Plugin["applyToEnvironment"] = (env) =>
  env.name !== "rsc";

export function wrapServerPlugin<T extends Plugin | Plugin[]>(p: T): T {
  const wrap = (p: Plugin): Plugin => ({
    ...p,
    applyToEnvironment: applyPluginToServer,
  });
  return (Array.isArray(p) ? p.map((p) => wrap(p)) : wrap(p)) as any;
}

export function wrapClientPlugin<T extends Plugin | Plugin[]>(p: T): T {
  const wrap = (p: Plugin): Plugin => ({
    ...p,
    applyToEnvironment: applyPluginToClient,
  });
  return (Array.isArray(p) ? p.map((p) => wrap(p)) : wrap(p)) as any;
}

export function invalidateModule(server: ViteDevServer, id: string) {
  const mod = server.moduleGraph.getModuleById(id);
  if (mod) {
    server.moduleGraph.invalidateModule(mod);
  }
}

// cf. https://github.com/vercel/next.js/blob/5ae286ffd664e5c76841ed64f6e2da85a0835922/packages/next/src/build/webpack/loaders/get-module-build-info.ts#L8
export type CustomModuleMeta = {
  $$rsc?: {
    type: "client";
  };
};

export const ENTRY_BROWSER_WRAPPER = "virtual:entry-client-wrapper";
export const ENTRY_SERVER_WRAPPER = "virtual:entry-server-wrapper";

export const USE_CLIENT_RE = /^("use client"|'use client')/;
export const USE_CLIENT = "use client";
export const USE_SERVER = "use server";

export function hashString(v: string) {
  return nodeCrypto
    .createHash("sha256")
    .update(v)
    .digest()
    .toString("hex")
    .slice(0, 10);
}

export function createVirtualPlugin(
  name: string,
  load: Plugin["load"],
): Plugin {
  name = "virtual:" + name;
  return {
    name: `virtual-${name}`,
    resolveId(source, _importer, _options) {
      if (source === name || source.startsWith(`${name}?`)) {
        return `\0${source}`;
      }
      return;
    },
    load(id, options) {
      if (id === `\0${name}` || id.startsWith(`\0${name}?`)) {
        return (load as any).apply(this, [id, options]);
      }
    },
  };
}
