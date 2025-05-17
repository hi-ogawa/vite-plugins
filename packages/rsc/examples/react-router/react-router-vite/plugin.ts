import childProcess from "node:child_process";
import path from "node:path";
import type { RouteConfigEntry } from "@react-router/dev/routes";
import { type Plugin, runnerImport } from "vite";

let typegen: childProcess.ChildProcess;

export function reactRouter(): Plugin[] {
  return [
    {
      name: "react-router:routes",
      async load(id) {
        if (id.endsWith("?react-router-routes")) {
          const imported = await runnerImport<any>(id);
          const appDirectory = path.dirname(id);
          const routes = [
            {
              id: "root",
              path: "",
              file: path.resolve(appDirectory, "root.tsx"),
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
    {
      name: "react-router:typegen",
      apply: "serve",
      buildStart() {
        typegen = childProcess.spawn("react-router", ["typegen", "--watch"]);
      },
      buildEnd() {
        if (typegen) typegen.kill();
        typegen = undefined!;
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
