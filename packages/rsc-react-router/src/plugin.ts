import assert from "node:assert";
import { createRequire } from "node:module";
import path from "node:path";
import rsc from "@hiogawa/vite-rsc/plugin";
import type { Config as ReactRouterConfig } from "@react-router/dev/config";
import type { RouteConfigEntry } from "@react-router/dev/routes";
import { type Plugin, runnerImport } from "vite";

const require = createRequire(import.meta.url);
const PKG_NAME = "@hiogawa/vite-rsc-react-router";

export function reactRouter(reactRouterOptions: ReactRouterConfig): Plugin[] {
  const appDirectory = path.resolve(
    process.cwd(),
    reactRouterOptions.appDirectory || "app",
  );
  return [
    ...rsc({
      entries: {
        rsc: require.resolve(`${PKG_NAME}/entry.rsc.node`),
        ssr: require.resolve(`${PKG_NAME}/entry.ssr`),
        client: require.resolve(`${PKG_NAME}/entry.browser`),
      },
    }),
    {
      name: "rsc-react-router",
      configEnvironment(_name, config, _env) {
        // fixup `optimizeDeps.include` for transitive dependency
        if (config.optimizeDeps?.include) {
          const SUB_PKG_NAME = "@hiogawa/vite-rsc";
          config.optimizeDeps.include = config.optimizeDeps.include.map(
            (name) => {
              if (name.startsWith(SUB_PKG_NAME)) {
                name = `${PKG_NAME} > ${name}`;
              }
              return name;
            },
          );
        }

        return {
          resolve: {
            noExternal: [PKG_NAME],
          },
          optimizeDeps: {
            exclude: [PKG_NAME],
          },
        };
      },
    },
    {
      name: "react-router:routes",
      async resolveId(source, _importer, options) {
        // redirect virtual module to `app/routes.(ext)` file
        if (source === "virtual:vite-rsc-react-router/routes") {
          const file =
            path.join(appDirectory, "routes") + "?react-router-routes";
          const resolved = await this.resolve(file, undefined, options);
          assert(resolved, "Cannot find 'routes' file");
          return resolved;
        }
      },
      async load(id) {
        if (id.endsWith("?react-router-routes")) {
          const imported = await runnerImport<any>(id);
          const rootResolved = await this.resolve(
            path.join(appDirectory, "root"),
          );
          assert(rootResolved, "Cannot find 'root' file");
          const routes = [
            {
              id: "root",
              path: "",
              file: rootResolved.id,
              children: imported.module.default,
            },
          ];
          const code = generateRoutesCode({
            appDirectory,
            routes,
          });
          return code;
        }
      },
    },
  ];
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
