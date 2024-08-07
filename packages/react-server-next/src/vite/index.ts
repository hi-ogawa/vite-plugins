import { existsSync, readFileSync } from "node:fs";
import path, { resolve } from "node:path";
import {
  type ReactServerPluginOptions,
  vitePluginReactServer,
} from "@hiogawa/react-server/plugin";
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
import { type AdapterType, adapterPlugin } from "./adapters";

export type ReactServerNextPluginOptions = {
  adapter?: AdapterType;
};

export default function vitePluginReactServerNext(
  options?: ReactServerPluginOptions & ReactServerNextPluginOptions,
): PluginOption {
  const outDir = options?.outDir ?? "dist";
  return [
    react(),
    nextJsxPlugin(),
    tsconfigPaths(),
    vitePluginReactServer({
      ...options,
      routeDir: options?.routeDir ?? "app",
      plugins: [nextJsxPlugin(), tsconfigPaths(), ...(options?.plugins ?? [])],
    }),
    vitePluginLogger(),
    vitePluginSsrMiddleware({
      entry: "next/vite/entry-ssr",
      preview: path.resolve(outDir, "server", "index.js"),
    }),
    adapterPlugin({ adapter: options?.adapter, outDir }),
    appFaviconPlugin(),
    nextEnvironmentPlugin(),
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

function nextEnvironmentPlugin(): Plugin {
  return {
    name: nextEnvironmentPlugin.name,
    config: ({ root: root = process.cwd(), envDir, envPrefix }, { mode }) => {
      envPrefix = ["NEXT_PUBLIC_", ...[envPrefix ?? []]].flat();
      const resolvedRoot = resolve(root);
      envDir = envDir ? resolve(resolvedRoot, envDir) : resolvedRoot;

      const env = loadEnv(mode, envDir, envPrefix);
      const allEnvs = loadEnv(mode, envDir, "");
      Object.assign(process.env, { ...process.env, ...allEnvs });
      return {
        define: Object.entries(env).reduce(
          (vars, [key, value]) => {
            if (value !== undefined)
              vars[`process.env.${key}`] = JSON.stringify(value);
            return vars;
          },
          {} as Record<string, string | null>,
        ),
        envPrefix,
      };
    },
  };
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
