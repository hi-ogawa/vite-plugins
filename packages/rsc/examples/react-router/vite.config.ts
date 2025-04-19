import assert from "node:assert";
import { createHash } from "node:crypto";
import path from "node:path";
import {
  transformDirectiveProxyExport,
  transformServerActionServer,
} from "@hiogawa/transforms";
import { createRequestListener } from "@mjackson/node-fetch-server";
import react from "@vitejs/plugin-react";
import {
  // type Manifest,
  type Plugin,
  type ResolvedConfig,
  // Rollup,
  RunnableDevEnvironment,
  type ViteDevServer,
  defaultServerConditions,
  defineConfig,
  parseAstAsync,
} from "vite";
import type { ModuleRunner } from "vite/module-runner";

// TODO: move to `@hiogawa/vite-rsc`

// state for build orchestration
// let browserManifest: Manifest;
// let browserBundle: Rollup.OutputBundle;
let clientReferences: Record<string, string> = {};
let serverReferences: Record<string, string> = {};
let buildScan = false;
let server: ViteDevServer;
let config: ResolvedConfig;
let viteSsrRunner: ModuleRunner;
let viteRscRunner: ModuleRunner;

// const CLIENT_ENTRY = "/src/entry.browser.tsx";
const SSR_ENTRY = "/src/entry.ssr.tsx";
const RSC_ENTRY = "/src/entry.rsc.tsx";

export default defineConfig({
  appType: "custom",
  clearScreen: false,
  build: {
    minify: false,
  },
  plugins: [
    react(),
    {
      name: "misc",
      configResolved(config_) {
        config = config_;
      },
      configureServer(server_) {
        server = server_;
        viteSsrRunner = (server.environments.ssr as RunnableDevEnvironment)
          .runner;
        viteRscRunner = (server.environments.rsc as RunnableDevEnvironment)
          .runner;
        (globalThis as any).__viteRscRunner = viteRscRunner;
        return () => {
          server.middlewares.use(async (req, res, next) => {
            try {
              const mod = await viteSsrRunner.import(SSR_ENTRY);
              createRequestListener(mod.default)(req, res);
            } catch (e) {
              next(e);
            }
          });
        };
      },
      async configurePreviewServer(server) {
        const mod = await import(
          /* @vite-ignore */ path.resolve("dist/ssr/index.js")
        );
        const handler = createRequestListener(mod.default);
        return () => {
          server.middlewares.use(async (req, res, next) => {
            try {
              handler(req, res);
            } catch (e) {
              next(e);
            }
          });
        };
      },
    },
    {
      // externalize `dist/rsc/...` import as relative path in ssr build
      name: "virtual:import-rsc",
      resolveId(source) {
        if (source === "virtual:vite-rsc/import-rsc") {
          return {
            id: `\0` + source,
            external: this.environment.mode === "build",
          };
        }
      },
      load(id) {
        if (id === "\0virtual:vite-rsc/import-rsc") {
          return `export default () => __viteRscRunner.import(${JSON.stringify(RSC_ENTRY)})`;
        }
      },
      renderChunk(code, chunk) {
        if (code.includes("__VIRTUAL_IMPORT_RSC__")) {
          const replacement = path.relative(
            path.join("dist/ssr", chunk.fileName, ".."),
            path.join("dist/rsc", "index.js"),
          );
          code = code.replace("__VIRTUAL_VITE_RSC_IMPORT_RSC__", replacement);
          return { code };
        }
        return;
      },
    },
    vitePluginUseClient(),
    vitePluginUseServer(),
    virtualNormalizeReferenceIdPlugin(),
    vitePluginSilenceDirectiveBuildWarning(),
  ],
  environments: {
    client: {},
    ssr: {
      build: {
        outDir: "dist/ssr",
        rollupOptions: {
          input: { index: "/src/entry.ssr.ts" },
        },
      },
    },
    rsc: {
      resolve: {
        conditions: ["react-server", ...defaultServerConditions],
        noExternal: ["react", "react-dom", "react-server-dom-webpack"],
      },
      optimizeDeps: {
        include: [
          "react",
          "react/jsx-runtime",
          "react/jsx-dev-runtime",
          "react-server-dom-webpack/server.edge",
        ],
      },
      build: {
        outDir: "dist/rsc",
        rollupOptions: {
          input: { index: "/src/entry.rsc.ts" },
        },
      },
    },
  },
  builder: {
    async buildApp(builder) {
      builder;
    },
  },
}) as any;

function hashString(v: string) {
  return createHash("sha256").update(v).digest().toString("hex").slice(0, 12);
}

async function normalizeReferenceId(id: string, name: "client" | "rsc") {
  if (!server) {
    return hashString(path.relative(config.root, id));
  }

  // align with how Vite import analysis would rewrite id
  // to avoid double modules on browser and ssr.
  const environment = server.environments[name]!;
  const transformed = await environment.transformRequest(
    "virtual:vite-rsc/normalize-reference-id/" + encodeURIComponent(id),
  );
  assert(transformed);
  const m = transformed.code.match(
    /(?:__vite_ssr_dynamic_import__|import)\("(.*)"\)/,
  );
  const newId = m?.[1];
  if (!newId) {
    console.error("[normalizeReferenceId]", {
      name,
      id,
      code: transformed.code,
    });
    throw new Error("normalizeReferenceId");
  }
  return newId;
}

function virtualNormalizeReferenceIdPlugin(): Plugin {
  const prefix = "virtual:vite-rsc/normalize-reference-id/";
  return {
    name: virtualNormalizeReferenceIdPlugin.name,
    apply: "serve",
    resolveId(source, _importer, _options) {
      if (source.startsWith(prefix)) {
        return "\0" + source;
      }
    },
    load(id, _options) {
      if (id.startsWith("\0" + prefix)) {
        id = decodeURIComponent(id.slice(prefix.length + 1));
        return `export default () => import("${id}")`;
      }
    },
  };
}

function vitePluginUseClient(): Plugin[] {
  return [
    {
      name: vitePluginUseClient.name,
      async transform(code, id) {
        if (this.environment.name !== "rsc") return;
        if (!code.includes("use client")) return;
        if (buildScan) return;

        const ast = await parseAstAsync(code);
        const normalizedId = await normalizeReferenceId(id, "client");
        let output = await transformDirectiveProxyExport(ast, {
          directive: "use client",
          id: normalizedId,
          runtime: "$$register",
        });
        if (!output) return;
        clientReferences[normalizedId] = id;
        output.prepend(`
          import * as $$ReactServer from "react-server-dom-webpack/server.edge";
          const $$register = (id, name) => $$ReactServer.registerClientReference({}, id, name);
        `);
        return { code: output.toString(), map: { mappings: "" } };
      },
    },
    createVirtualPlugin("vite-rsc/client-references", function () {
      if (this.environment.mode === "dev") {
        return { code: `export {}`, map: null };
      }
      let code = generateDynamicImportCode(clientReferences);
      return { code, map: null };
    }),
  ];
}

function vitePluginUseServer(): Plugin[] {
  return [
    {
      name: vitePluginUseServer.name,
      async transform(code, id) {
        if (id.includes("/.vite/")) return;
        if (!code.includes("use server")) return;
        const ast = await parseAstAsync(code);
        const normalizedId = await normalizeReferenceId(id, "rsc");
        if (this.environment.name === "rsc") {
          const { output } = await transformServerActionServer(code, ast, {
            id: normalizedId,
            runtime: "$$register",
          });
          if (!output.hasChanged()) return;
          serverReferences[normalizedId] = id;
          output.prepend(`
            import * as $$ReactServer from "react-server-dom-webpack/server.edge";
            const $$register = (value, id, name) => {
              if (typeof value !== 'function') return value;
              return $$ReactServer.registerServerReference(value, id, name);
            }
          `);
          return {
            code: output.toString(),
            map: output.generateMap({ hires: "boundary" }),
          };
        } else {
          const output = await transformDirectiveProxyExport(ast, {
            id: normalizedId,
            runtime: "$$proxy",
            directive: "use server",
          });
          if (!output?.hasChanged()) return;
          serverReferences[normalizedId] = id;
          const name = this.environment.name === "client" ? "browser" : "edge";
          output.prepend(`
            import * as $$ReactClient from "react-server-dom-webpack/server.${name}";
            const $$proxy = (id, name) => $$ReactClient.createServerReference(${JSON.stringify(id + "#" + name)}, (...args) => __viteRscCallServer(...args))
          `);
          return { code: output.toString(), map: { mappings: "" } };
        }
      },
    },
    createVirtualPlugin("vite-rsc/server-references", function () {
      if (this.environment.mode === "dev") {
        return { code: `export {}`, map: null };
      }
      const code = generateDynamicImportCode(serverReferences);
      return { code, map: null };
    }),
  ];
}

function createVirtualPlugin(name: string, load: Plugin["load"]) {
  name = "virtual:" + name;
  return {
    name: `virtual-${name}`,
    resolveId(source, _importer, _options) {
      return source === name ? "\0" + name : undefined;
    },
    load(id, options) {
      if (id === "\0" + name) {
        return (load as Function).apply(this, [id, options]);
      }
    },
  } satisfies Plugin;
}

// silence warning due to "use ..." directives
// https://github.com/vitejs/vite-plugin-react/blob/814ed8043d321f4b4679a9f4a781d1ed14f185e4/packages/plugin-react/src/index.ts#L303
function vitePluginSilenceDirectiveBuildWarning(): Plugin {
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
                warning.code === "MODULE_LEVEL_DIRECTIVE" &&
                (warning.message.includes(`use client`) ||
                  warning.message.includes(`use server`))
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

function generateDynamicImportCode(map: Record<string, string>) {
  let code = Object.entries(map)
    .map(
      ([key, id]) =>
        `${JSON.stringify(key)}: () => import(${JSON.stringify(id)}),`,
    )
    .join("\n");
  return `export default {${code}};\n`;
}
