import nodeCrypto from "node:crypto";
import type { Plugin, ViteDevServer } from "vite";

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

// silence warning due to "use ..." directives
// https://github.com/vitejs/vite-plugin-react/blob/814ed8043d321f4b4679a9f4a781d1ed14f185e4/packages/plugin-react/src/index.ts#L303
export function vitePluginSilenceDirectiveBuildWarning(): Plugin {
  return {
    name: vitePluginSilenceDirectiveBuildWarning.name,
    enforce: "post",
    config(config, _env) {
      return {
        build: {
          rollupOptions: {
            onwarn(warning, defaultHandler) {
              // https://github.com/vitejs/vite/issues/15012#issuecomment-1948550039
              if (
                warning.code === "SOURCEMAP_ERROR" &&
                warning.message.includes("(1:0)")
              ) {
                return;
              }
              // https://github.com/TanStack/query/pull/5161#issuecomment-1506683450
              if (
                (warning.code === "MODULE_LEVEL_DIRECTIVE" &&
                  warning.message.includes(`"use client"`)) ||
                warning.message.includes(`"use server"`)
              ) {
                return;
              }
              if (config.build?.rollupOptions?.onwarn) {
                config.build.rollupOptions.onwarn(warning, defaultHandler);
              } else {
                defaultHandler(warning);
              }
            },
          },
        },
      };
    },
  };
}
