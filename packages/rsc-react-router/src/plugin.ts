import assert from "node:assert/strict";
import * as childProcess from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import type { Config } from "@react-router/dev/config";
import type { RouteConfigEntry } from "@react-router/dev/routes";
import {
  type EnvironmentOptions,
  type Plugin,
  createIdResolver,
  runnerImport,
} from "vite";

const PKG_NAME = "@hiogawa/vite-rsc-react-router";

const require = createRequire(import.meta.url);

export function reactRouter(options?: {
  typegen?: boolean;
}): Plugin[] {
  let idResolver: ReturnType<typeof createIdResolver>;
  let typegenProcess: childProcess.ChildProcess | undefined;

  return [
    {
      name: "react-router:config",
      config() {
        const toEnvironmentOption = (entry: string) =>
          ({
            build: {
              rollupOptions: {
                input: {
                  // TODO: specifying module runner entry as package entry breaks reload
                  // https://github.com/vitejs/vite/issues/19975
                  // so for now fully resolve it manually.
                  index: require.resolve(`${PKG_NAME}/${entry}`),
                },
              },
            },
          }) satisfies EnvironmentOptions;
        return {
          environments: {
            client: toEnvironmentOption("entry.browser"),
            ssr: toEnvironmentOption("entry.ssr"),
            rsc: toEnvironmentOption("entry.rsc.single"),
          },
        };
      },
      configEnvironment(_name, _config, _env) {
        return {
          resolve: {
            noExternal: [PKG_NAME],
          },
          optimizeDeps: {
            exclude: [PKG_NAME],
          },
        };
      },
      configResolved(config) {
        idResolver = createIdResolver(config);
      },
      resolveId(source) {
        if (source === "virtual:react-router-routes") {
          return "\0" + source;
        }
      },
      async load(id) {
        if (id === "\0virtual:react-router-routes") {
          const findFile = (id: string) => idResolver(this.environment, id);
          const config = await readReactRouterConfig(findFile);
          this.addWatchFile(config.configFile);
          this.addWatchFile(config.routesFile);
          const code = generateRoutesCode(config);
          return code;
        }
      },
    },
    {
      name: "react-router:typegen",
      apply: (_config, env) => env.command === "serve" && !!options?.typegen,
      buildStart() {
        typegenProcess?.kill();
        typegenProcess = childProcess.spawn("react-router", [
          "typegen",
          "--watch",
        ]);
      },
      buildEnd() {
        typegenProcess?.kill();
        typegenProcess = undefined;
      },
    },
  ];
}

async function readReactRouterConfig(
  findFile: (id: string) => Promise<string | undefined>,
) {
  // find react-router.config.ts
  const configFile = await findFile("./react-router.config");
  assert(configFile, "Cannot find 'react-router.config' file");
  const configImport = await runnerImport<{ default: Config }>(configFile);
  const appDirectory = path.resolve(
    configImport.module.default.appDirectory ?? "app",
  );

  // find routes.ts
  const routesFile = await findFile(path.join(appDirectory, "routes"));
  assert(routesFile, "Cannot find 'routes' file");
  const routesImport = await runnerImport<{
    default: RouteConfigEntry[];
  }>(routesFile);

  // find root.tsx
  const rootFile = await findFile(path.join(appDirectory, "root"));
  assert(rootFile, "Cannot find 'root' file");

  const routes = [
    {
      id: "root",
      path: "",
      file: rootFile + "?vite-rsc-css-export=Layout",
      children: routesImport.module.default,
    },
  ];

  return { configFile, routesFile, appDirectory, routes };
}

// copied from
// https://github.com/jacob-ebey/parcel-plugin-react-router/blob/9385be813534537dfb0fe640a3e5c5607be3b61d/packages/resolver/src/resolver.ts

function generateRoutesCode(config: {
  appDirectory: string;
  routes: RouteConfigEntry[];
}) {
  let code = "export default [";
  const closeRouteSymbol = Symbol("CLOSE_ROUTE");
  let stack: Array<typeof closeRouteSymbol | RouteConfigEntry> = [
    ...config.routes,
  ];
  while (stack.length > 0) {
    const route = stack.pop();
    if (!route) break;
    if (route === closeRouteSymbol) {
      code += "]},";
      continue;
    }
    code += "{";
    // TODO: route-module transform
    code += `lazy: () => import(${JSON.stringify(path.resolve(config.appDirectory, route.file))}),`;
    code += `id: ${JSON.stringify(route.id || createRouteId(route.file, config.appDirectory))},`;
    if (typeof route.path === "string") {
      code += `path: ${JSON.stringify(route.path)},`;
    }
    if (route.index) {
      code += `index: true,`;
    }
    if (route.caseSensitive) {
      code += `caseSensitive: true,`;
    }
    if (route.children) {
      code += ["children:["];
      stack.push(closeRouteSymbol);
      stack.push(...[...route.children].reverse());
    } else {
      code += "},";
    }
  }
  code += "];\n";

  return code;
}

function createRouteId(file: string, appDirectory: string) {
  return path
    .relative(appDirectory, file)
    .replace(/\\+/, "/")
    .slice(0, -path.extname(file).length);
}
