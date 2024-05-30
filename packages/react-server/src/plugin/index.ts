import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createDebug, tinyassert, typedBoolean } from "@hiogawa/utils";
import {
  type ConfigEnv,
  type InlineConfig,
  type Manifest,
  type Plugin,
  type PluginOption,
  type ViteDevServer,
  build,
  createLogger,
  createServer,
} from "vite";
import {
  vitePluginClientUseServer,
  vitePluginServerUseServer,
} from "../features/server-action/plugin";
import {
  vitePluginClientUseClient,
  vitePluginServerUseClient,
} from "../features/use-client/plugin";
import { $__global } from "../lib/global";
import { collectStyle, collectStyleUrls } from "./css";
import {
  ENTRY_CLIENT,
  ENTRY_CLIENT_WRAPPER,
  ENTRY_REACT_SERVER,
  ENTRY_REACT_SERVER_WRAPPER,
  type SsrAssetsType,
  createVirtualPlugin,
  hashString,
  vitePluginSilenceDirectiveBuildWarning,
} from "./utils";

const debug = createDebug("react-server:plugin");

// resolve import paths for `createClientReference`, `createServerReference`, etc...
// since `import "@hiogawa/react-server"` is not always visible for exernal library.
const RUNTIME_BROWSER_PATH = fileURLToPath(
  new URL("../runtime-browser.js", import.meta.url),
);
const RUNTIME_SERVER_PATH = fileURLToPath(
  new URL("../runtime-server.js", import.meta.url),
);
const RUNTIME_REACT_SERVER_PATH = fileURLToPath(
  new URL("../runtime-react-server.js", import.meta.url),
);

// convenient singleton to share states
export type { ReactServerManager };

class ReactServerManager {
  parentServer?: ViteDevServer;

  buildType?: "scan" | "rsc" | "client" | "ssr";

  // expose "use client" node modules to client via virtual modules
  // to avoid dual package due to deps optimization hash during dev
  nodeModules = {
    useClient: new Map<string, { id: string; exportNames: Set<string> }>(),
  };

  // all files in parent server
  parentIds = new Set<string>();
  // all files in rsc server
  rscIds = new Set<string>();
  // "use client" files in rsc server
  rscUseClientIds = new Set<string>();
  // "use server" files in rsc server
  rscUseServerIds = new Set<string>();

  shouldReloadRsc(id: string) {
    const ok = this.rscIds.has(id) && !this.rscUseClientIds.has(id);
    debug("[RscManager.shouldReloadRsc]", { ok, id });
    return ok;
  }
}

// persist singleton during build
if (!process.argv.includes("build")) {
  delete (globalThis as any).__VITE_REACT_SERVER_MANAGER;
}
const manager: ReactServerManager = ((
  globalThis as any
).__VITE_REACT_SERVER_MANAGER ??= new ReactServerManager());

export function vitePluginReactServer(options?: {
  plugins?: PluginOption[];
}): Plugin[] {
  let parentServer: ViteDevServer | undefined;
  let parentEnv: ConfigEnv;

  const reactServerViteConfig: InlineConfig = {
    customLogger: createLogger(undefined, {
      prefix: "[react-server]",
      allowClearScreen: false,
    }),
    clearScreen: false,
    configFile: false,
    cacheDir: "./node_modules/.vite-rsc",
    optimizeDeps: {
      noDiscovery: true,
      include: [],
    },
    ssr: {
      resolve: {
        conditions: ["react-server"],
        externalConditions: ["react-server"],
      },
    },
    plugins: [
      vitePluginSilenceDirectiveBuildWarning(),

      // expose server reference to react-server itself
      vitePluginServerUseServer({
        manager,
        runtimePath: RUNTIME_REACT_SERVER_PATH,
      }),

      // transform "use client" into client referecnes
      vitePluginServerUseClient({
        manager,
        runtimePath: RUNTIME_REACT_SERVER_PATH,
      }),

      // expose server references for RSC build via virtual module
      createVirtualPlugin("server-references", async () => {
        if (manager.buildType === "scan") {
          return `export default {}`;
        }
        tinyassert(manager.buildType === "rsc");
        let result = `export default {\n`;
        for (const id of manager.rscUseServerIds) {
          let key = manager.buildType ? hashString(id) : id;
          result += `"${key}": () => import("${id}"),\n`;
        }
        result += "};\n";
        debug("[virtual:server-references]", result);
        return result;
      }),

      createVirtualPlugin(
        ENTRY_REACT_SERVER_WRAPPER.slice("virtual:".length),
        () => {
          // this virtual is not necessary anymore but has been used in the past
          // to extend user's react-server entry like ENTRY_CLIENT_WRAPPER
          return /* js */ `
            export * from "${ENTRY_REACT_SERVER}";
          `;
        },
      ),

      {
        name: "patch-react-server-dom-webpack",
        transform(code, id, _options) {
          if (id.includes("react-server-dom-webpack")) {
            // rename webpack markers in react server runtime
            // to avoid conflict with ssr runtime which shares same globals
            code = code.replaceAll(
              "__webpack_require__",
              "__vite_react_server_webpack_require__",
            );
            code = code.replaceAll(
              "__webpack_chunk_load__",
              "__vite_react_server_webpack_chunk_load__",
            );

            // make server reference async for simplicity (stale chunkCache, etc...)
            // see TODO in https://github.com/facebook/react/blob/33a32441e991e126e5e874f831bd3afc237a3ecf/packages/react-server-dom-webpack/src/ReactFlightClientConfigBundlerWebpack.js#L131-L132
            code = code.replaceAll("if (isAsyncImport(metadata))", "if (true)");
            code = code.replaceAll("4 === metadata.length", "true");

            return code;
          }
          return;
        },
      },

      ...(options?.plugins ?? []),
    ],
    build: {
      ssr: true,
      manifest: true,
      ssrEmitAssets: true,
      outDir: "dist/rsc",
      rollupOptions: {
        input: {
          index: ENTRY_REACT_SERVER_WRAPPER,
        },
      },
    },
  };

  const rscParentPlugin: Plugin = {
    name: vitePluginReactServer.name,
    config(_config, env) {
      parentEnv = env;
      return {
        optimizeDeps: {
          // this can potentially include unnecessary server only deps for client,
          // but there should be no issues except making deps optimization slightly slower.
          entries: ["./src/routes/**/(page|layout|error).(js|jsx|ts|tsx)"],
          exclude: ["@hiogawa/react-server"],
          include: [
            "react",
            "react/jsx-runtime",
            "react/jsx-dev-runtime",
            "react-dom/client",
            "react-server-dom-webpack/client.browser",
            "@hiogawa/react-server > @tanstack/history",
            "@hiogawa/react-server > use-sync-external-store/shim/with-selector.js",
          ],
        },
        ssr: {
          noExternal: true,
          optimizeDeps: {
            exclude: ["@hiogawa/react-server"],
            include: [
              "react",
              "react/jsx-runtime",
              "react/jsx-dev-runtime",
              "react-dom/server.edge",
              "react-server-dom-webpack/client.edge",
              "@hiogawa/react-server > use-sync-external-store/shim/with-selector.js",
            ],
          },
        },
        build: {
          manifest: true,
          outDir: env.isSsrBuild ? "dist/server" : "dist/client",
          rollupOptions: env.isSsrBuild
            ? undefined
            : {
                input: ENTRY_CLIENT_WRAPPER,
              },
        },
      };
    },
    async configureServer(server) {
      parentServer = server;
      manager.parentServer = server;
    },
    async buildStart(_options) {
      if (parentEnv.command === "serve") {
        tinyassert(parentServer);
        const reactServer = await createServer(reactServerViteConfig);
        reactServer.pluginContainer.buildStart({});
        $__global.dev = {
          server: parentServer,
          reactServer: reactServer,
        };
      }
    },
    async buildEnd(_options) {
      if (parentEnv.command === "serve") {
        await $__global.dev.reactServer.close();
        delete ($__global as any).dev;
      }
    },
    transform(_code, id, _options) {
      if (!id.includes("/node_modules/")) {
        manager.parentIds.add(id);
      }
    },
    async handleHotUpdate(ctx) {
      tinyassert(parentServer);

      // re-render RSC with custom event
      if (ctx.modules.every((m) => m.id && manager.shouldReloadRsc(m.id))) {
        parentServer.hot.send({
          type: "custom",
          event: "rsc:update",
          data: {
            file: ctx.file,
          },
        });

        // Some rsc files are included in parent module graph
        // due to postcss creating dependency from style.css to all source files.
        // In this case, reload all importers (for css hmr),
        // and return empty modules to avoid full-reload
        if (ctx.modules.every((m) => m.id && !manager.parentIds.has(m.id))) {
          for (const m of ctx.modules) {
            for (const imod of m.importers) {
              await parentServer.reloadModule(imod);
            }
          }
          return [];
        }
      }
      return ctx.modules;
    },
  };

  // orchestrate four builds from a single vite (browser) build
  const buildOrchestrationPlugin: Plugin = {
    name: vitePluginReactServer.name + ":build",
    apply: "build",
    async buildStart(_options) {
      if (!manager.buildType) {
        console.log("▶▶▶ REACT SERVER BUILD (scan) [1/4]");
        manager.buildType = "scan";
        await build(reactServerViteConfig);
        console.log("▶▶▶ REACT SERVER BUILD (server) [2/4]");
        manager.buildType = "rsc";
        await build(reactServerViteConfig);
        console.log("▶▶▶ REACT SERVER BUILD (browser) [3/4]");
        manager.buildType = "client";
      }
    },
    async closeBundle() {
      if (manager.buildType === "client") {
        console.log("▶▶▶ REACT SERVER BUILD (ssr) [4/4]");
        manager.buildType = "ssr";
        await build({
          build: {
            ssr: true,
          },
        });
      }
    },
  };

  // plugins for main vite dev server (browser / ssr)
  return [
    rscParentPlugin,
    buildOrchestrationPlugin,
    vitePluginSilenceDirectiveBuildWarning(),
    vitePluginClientUseServer({
      manager,
      runtimePath: RUNTIME_BROWSER_PATH,
      ssrRuntimePath: RUNTIME_SERVER_PATH,
    }),
    vitePluginClientUseClient({ manager }),
    createVirtualPlugin("client-references", () => {
      tinyassert(manager.buildType && manager.buildType !== "rsc");
      return fs.promises.readFile("dist/rsc/client-references.js", "utf-8");
    }),
    createVirtualPlugin("ssr-assets", async () => {
      // dev
      if (!manager.buildType) {
        // extract <head> injected by plugins
        const html = await $__global.dev.server.transformIndexHtml(
          "/",
          "<html><head></head></html>",
        );
        const match = html.match(/<head>(.*)<\/head>/s);
        tinyassert(match && 1 in match);
        let head = match[1];

        // expose raw dynamic `import` which doesn't go through vite's transform
        // since it would inject `<id>?import` and cause dual packages when
        // client code is both imported at the boundary (as `<id>?import`)
        // and not at the boundary (as `<id>`).
        head += `<script>globalThis.__raw_import = (id) => import(id)</script>\n`;

        // serve dev css as ?direct so that ssr html won't get too huge.
        // also remove style on first hot update.
        head += `\
          <link
            data-ssr-dev-css
            rel="stylesheet"
            href="/@id/__x00__virtual:dev-ssr-css.css?direct"
          />
          <script type="module">
            import { createHotContext } from "/@vite/client";
            const hot = createHotContext("hot-data-ssr-dev-css");
            hot.on("vite:afterUpdate", () => {
              document
                .querySelectorAll("[data-ssr-dev-css]")
                .forEach(node => node.remove());
            });
          </script>
        `;
        const result: SsrAssetsType = {
          bootstrapModules: [`/@id/__x00__${ENTRY_CLIENT_WRAPPER}`],
          head,
        };
        return `export default ${JSON.stringify(result)}`;
      }

      // build
      if (manager.buildType === "ssr") {
        const manifest: Manifest = JSON.parse(
          await fs.promises.readFile(
            "dist/client/.vite/manifest.json",
            "utf-8",
          ),
        );
        const entry = manifest[ENTRY_CLIENT_WRAPPER];
        tinyassert(entry);
        const css = entry.css ?? [];
        const js =
          entry.dynamicImports
            ?.map((k) => manifest[k]?.file)
            .filter(typedBoolean) ?? [];
        const head = [
          ...css.map((href) => `<link rel="stylesheet" href="/${href}" />`),
          ...js.map((href) => `<link rel="modulepreload" href="/${href}" />`),
        ].join("\n");
        const result: SsrAssetsType = {
          bootstrapModules: [`/${entry.file}`],
          head,
        };
        return `export default ${JSON.stringify(result)}`;
      }

      tinyassert(false);
    }),
    createVirtualPlugin(ENTRY_CLIENT_WRAPPER.slice("virtual:".length), () => {
      // dev
      if (!manager.buildType) {
        // wrapper entry to ensure client entry runs after vite/react inititialization
        return /* js */ `
          import "virtual:react-server-css.js";
          for (let i = 0; !window.__vite_plugin_react_preamble_installed__; i++) {
            await new Promise(resolve => setTimeout(resolve, 10 * (2 ** i)));
          }
          await import("${ENTRY_CLIENT}");
        `;
      }
      // build
      if (manager.buildType === "client") {
        // import "runtime-client" for preload
        return /* js */ `
          import "virtual:react-server-css.js";
          import("@hiogawa/react-server/runtime-client");
          import "${ENTRY_CLIENT}";
        `;
      }
      tinyassert(false);
    }),
    createVirtualPlugin("dev-ssr-css.css?direct", async () => {
      tinyassert(!manager.buildType);
      const styles = await Promise.all([
        `/******* react-server ********/`,
        collectStyle($__global.dev.reactServer, [ENTRY_REACT_SERVER]),
        `/******* client **************/`,
        collectStyle($__global.dev.server, [ENTRY_CLIENT]),
      ]);
      return styles.join("\n\n");
    }),
    createVirtualPlugin("react-server-css.js", async () => {
      // virtual module proxy css imports from react server to client
      // TODO: invalidate + full reload when add/remove css file?
      if (!manager.buildType) {
        const urls = await collectStyleUrls($__global.dev.reactServer, [
          ENTRY_REACT_SERVER,
        ]);
        const code = urls.map((url) => `import "${url}";\n`).join("");
        // ensure hmr boundary since css module doesn't have `import.meta.hot.accept`
        return code + `if (import.meta.hot) { import.meta.hot.accept() }`;
      }
      if (manager.buildType === "client") {
        // TODO: probe manifest to collect css?
        const files = await fs.promises.readdir("./dist/rsc/assets", {
          withFileTypes: true,
        });
        const code = files
          .filter((f) => f.isFile() && f.name.endsWith(".css"))
          .map((f) => path.join(f.path, f.name))
          .map((f) => `import "/${f}";\n`)
          .join("");
        return code;
      }
      tinyassert(false);
    }),
  ];
}
