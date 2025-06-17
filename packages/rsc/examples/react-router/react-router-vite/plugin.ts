import assert from "node:assert/strict";
import path from "node:path";
import type { Config } from "@react-router/dev/config";
import type { RouteConfigEntry } from "@react-router/dev/routes";
import { type Plugin, createIdResolver, runnerImport } from "vite";

export function reactRouter(): Plugin[] {
  let resolveId: ReturnType<typeof createIdResolver>;

  return [
    {
      name: "react-router:config",
      configResolved(config) {
        resolveId = createIdResolver(config);
      },
      resolveId(source) {
        if (source === "virtual:react-router-routes") {
          return "\0" + source;
        }
      },
      async load(id) {
        if (id === "\0virtual:react-router-routes") {
          // find react-router.config.ts
          const configFile = await resolveId(
            this.environment,
            "./react-router.config",
          );
          assert(configFile, "Cannot find 'react-router.config' file");
          const configImport = await runnerImport<{ default: Config }>(
            configFile,
          );
          const appDirectory = path.resolve(
            configImport.module.default.appDirectory ?? "app",
          );

          // find routes.ts
          const routesFile = await resolveId(
            this.environment,
            path.join(appDirectory, "routes"),
          );
          assert(routesFile, "Cannot find 'routes' file");
          const routesImport = await runnerImport<{
            default: RouteConfigEntry[];
          }>(routesFile);

          // find root.tsx
          const rootFile = await resolveId(
            this.environment,
            path.join(appDirectory, "root"),
          );
          assert(rootFile, "Cannot find 'root' file");

          this.addWatchFile(configFile);
          this.addWatchFile(routesFile);
          this.addWatchFile(rootFile);

          const routes = [
            {
              id: "root",
              path: "",
              file: rootFile,
              children: routesImport.module.default,
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
