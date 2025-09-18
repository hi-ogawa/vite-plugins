import assert from "node:assert";
import path from "node:path";
import type { Plugin, Rollup } from "vite";
import { type BuildAppOptions, buildApp } from "./utils";

// TODO:
// - default `dist` directory conflicts with "netlify" preset output

export type NitroPluginOptions = {
  /** @default { environmentName: 'client' } */
  client?: { environmentName: string } | false;
  /** @default { environmentName: 'ssr' } */
  server?: { environmentName: string; entryName?: string };
};

export default function nitroBuildPlugin(
  nitroPluginOptions?: NitroPluginOptions &
    Pick<BuildAppOptions, "config" | "prerender">,
): Plugin[] {
  const client = nitroPluginOptions?.client ?? { environmentName: "client" };
  const server = nitroPluginOptions?.server ?? { environmentName: "ssr" };
  let serverBundle: Rollup.OutputBundle;
  return [
    {
      name: "nitro",
      apply: "build",
      configEnvironment(name, _config, _env) {
        return {
          build: {
            outDir: `.nitro/vite/dist/${name}`,
          },
        };
      },
      writeBundle(_options, bundle) {
        if (this.environment.name === server.environmentName) {
          serverBundle = bundle;
        }
      },
      buildApp: {
        order: "post",
        handler: async (builder) => {
          assert(serverBundle);
          const serverEntryChunks: Record<string, Rollup.OutputChunk> = {};
          for (const chunk of Object.values(serverBundle)) {
            if (chunk.type === "chunk" && chunk.isEntry) {
              serverEntryChunks[chunk.name] = chunk;
            }
          }
          const selected = server.entryName
            ? serverEntryChunks[server.entryName]
            : Object.values(serverEntryChunks)[0];
          assert(
            selected,
            `no server entry is found for "${server.environmentName}" environment`,
          );
          const renderer = path.join(
            builder.environments[server.environmentName]!.config.build.outDir,
            selected.fileName,
          );

          const clientConfig = client
            ? builder.environments[client.environmentName]?.config
            : undefined;
          await buildApp({
            ...nitroPluginOptions,
            publicDir: clientConfig?.build.outDir,
            assetsDir: clientConfig?.build.assetsDir,
            renderer,
          });
        },
      },
    },
  ];
}
