import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import {
  type ReactServerPluginOptions,
  vitePluginReactServer,
} from "@hiogawa/react-server/plugin";
import {
  vitePluginFetchUrlImportMetaUrl,
  vitePluginWasmModule,
} from "@hiogawa/vite-plugin-server-asset";
import {
  vitePluginLogger,
  vitePluginSsrMiddleware,
} from "@hiogawa/vite-plugin-ssr-middleware";
import react from "@vitejs/plugin-react-swc";
import {
  type Plugin,
  type PluginOption,
  loadEnv,
  transformWithEsbuild,
} from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { type AdapterType, adapterPlugin, autoSelectAdapter } from "./adapters";

export type ReactServerNextPluginOptions = {
  adapter?: AdapterType;
};

export default function vitePluginReactServerNext(
  options?: ReactServerPluginOptions & ReactServerNextPluginOptions,
): PluginOption {
  const outDir = options?.outDir ?? "dist";
  const adapter = options?.adapter ?? autoSelectAdapter();

  return [
    react(),
    nextJsxPlugin(),
    tsconfigPaths(),
    nextConfigPlugin(),
    vitePluginReactServer({
      ...options,
      routeDir: options?.routeDir ?? "app",
    }),
    nextOgPlugin(),
    {
      applyToEnvironment: (env) => env.name === "react-server",
      ...vitePluginWasmModule({
        buildMode:
          adapter === "cloudflare" || adapter === "vercel-edge"
            ? "import"
            : "fs",
      }),
    },
    {
      applyToEnvironment: (env) => env.name === "react-server",
      ...vitePluginFetchUrlImportMetaUrl({
        buildMode:
          adapter === "cloudflare"
            ? "import"
            : adapter === "vercel-edge"
              ? "inline"
              : "fs",
      }),
    },
    vitePluginLogger(),
    vitePluginSsrMiddleware({
      entry: "next/vite/entry-ssr",
      preview: path.resolve(outDir, "server", "index.js"),
    }),
    Object.values(
      adapterPlugin({
        adapter,
        outDir,
      }),
    ),
    appFaviconPlugin(),
    {
      name: "next-exclude-optimize",
      config: () => ({
        ssr: {
          noExternal: ["next"],
        },
        optimizeDeps: {
          exclude: ["next"],
        },
      }),
    },
  ];
}

function nextOgPlugin(): Plugin[] {
  const require = createRequire(import.meta.url);

  return [
    {
      name: nextOgPlugin.name + ":config",
      config() {
        return {
          resolve: {
            alias: {
              "@vercel/og": path.resolve(
                require.resolve("@vercel/og/package.json"),
                "../dist/index.edge.js",
              ),
            },
          },
          // per-environment alias actually requires an extra plugin
          // so let's avoid this for now
          // https://github.com/vitejs/vite/pull/17583/#issuecomment-2200115882
          // environments: {
          //   'react-server': {
          //     resolve: {
          //       alias: {
          //         // use only edge build and deal with following special triggers
          //         // uniformly for any adapters via plugins
          //         //   import resvg_wasm from "./resvg.wasm?module";
          //         //   import yoga_wasm from "./yoga.wasm?module";
          //         //   fetch(new URL("./noto-sans-v27-latin-regular.ttf", import.meta.url))
          //         "@vercel/og": path.resolve(
          //           require.resolve("@vercel/og/package.json"),
          //           "../dist/index.edge.js",
          //         ),
          //       }
          //     }
          //   }
          // }
        };
      },
    },
  ];
}

function nextConfigPlugin(): Plugin {
  return {
    name: nextConfigPlugin.name,
    config() {
      // TODO
      // this is only for import.meta.env.NEXT_PUBLIC_xxx replacement.
      // we might want to define process.env.NEXT_PUBLIC_xxx for better compatibility.
      // https://nextjs.org/docs/app/building-your-application/configuring/environment-variables#bundling-environment-variables-for-the-browser
      return {
        envPrefix: ["VITE_", "NEXT_PUBLIC_"],
      };
    },
    configResolved(config) {
      updateEnv(() => loadEnv(config.mode, config.envDir, ""));
    },
  };
}

// workaround https://github.com/vitejs/vite/issues/17689
(globalThis as any).__next_vite_last_env__ ??= [];
declare let __next_vite_last_env__: string[];

function updateEnv(loadEnv: () => Record<string, string>) {
  for (const key of __next_vite_last_env__) {
    delete process.env[key];
  }
  const loadedEnv = loadEnv();
  __next_vite_last_env__ = Object.keys(loadedEnv).filter(
    (key) => !(key in process.env),
  );
  Object.assign(process.env, loadedEnv);
}

function nextJsxPlugin(): Plugin {
  return {
    name: nextJsxPlugin.name,
    // need to override next.js's default tsconfig `jsx: preserve`
    config: () => ({
      esbuild: { jsx: "automatic" },
      optimizeDeps: {
        esbuildOptions: { jsx: "automatic", loader: { ".js": "jsx" } },
      },
    }),
    // manually use esbuild transform to support jsx in js
    // TODO: try using vite-plugin-react-swc and parserConfig to support HMR
    // https://github.com/vitejs/vite-plugin-react-swc?tab=readme-ov-file#parserconfig
    async transform(code, id, _options) {
      if (!id.includes("/node_modules/") && id.endsWith(".js")) {
        return transformWithEsbuild(code, id, {
          loader: "jsx",
          jsx: "automatic",
        });
      }
      return;
    },
  };
}

/** @todo https://nextjs.org/docs/app/api-reference/file-conventions/metadata/app-icons */
function appFaviconPlugin(): Plugin {
  // not sure what exactly Next.js does.
  // for now, let's do quick workaround for app/favicon.ico
  return {
    name: appFaviconPlugin.name,
    apply: (_config, env) => env.command === "serve" || !env.isSsrBuild,
    configureServer(server) {
      if (existsSync("app/favicon.ico")) {
        server.middlewares.use((req, _res, next) => {
          const url = new URL(req.url || "", "https://tmp.local");
          if (url.pathname === "/favicon.ico") {
            req.url = "/app/favicon.ico";
          }
          next();
        });
      }
    },
    generateBundle() {
      if (existsSync("app/favicon.ico")) {
        this.emitFile({
          type: "asset",
          fileName: "favicon.ico",
          source: readFileSync("app/favicon.ico"),
        });
      }
    },
  };
}
