import path from "node:path";
import type { RouteConfigEntry } from "@react-router/dev/routes";
import { type Plugin, runnerImport, transformWithEsbuild } from "vite";
import * as babel from "./transformer/babel/babel.ts";
import { removeExports } from "./transformer/babel/remove-exports";
import { transformRouteModule } from "./transformer/transformer";

export function reactRouter(): Plugin[] {
  return [
    {
      name: "react-router",
      //
      // virtual routes.ts
      //
      async load(id) {
        if (id.endsWith("?react-router-routes")) {
          const imported = await runnerImport<any>(id);
          const appDirectory = path.dirname(id);
          const routes = [
            {
              id: "root",
              path: "",
              file: path.resolve(appDirectory, "root"),
              children: imported.module.default,
            },
          ];
          const code = generateRoutes({
            appDirectory,
            routes,
          });
          return code;
        }
      },
      //
      // transform route module
      //
      async transform(code, id) {
        // skip internal virtual module such as
        // \0virtual:vite-rsc/css/dev-ssr//src/routes/about.tsx?react-router-client-route-module
        if (id.startsWith("\0virtual")) return;

        if (id.endsWith("?react-router-route-module")) {
          const filePath = id.split("?")[0];
          const result = await transformRouteModule({
            code,
            filePath,
            clientHelper:
              "/react-router-vite/transformer/client-route-component-props.ts",
          });

          routeModuleAssets[filePath] = {};
          for (const asset of result.assets) {
            if (
              asset.uniqueKey === "client-route-module" ||
              asset.uniqueKey === "server-route-module"
            ) {
              const result = await transformWithEsbuild(
                asset.content,
                filePath,
                { loader: "jsx", jsx: "automatic" },
              );
              asset.content = replaceImport(result.code, filePath);
            }
            routeModuleAssets[filePath][asset.uniqueKey] = asset;
          }

          const resultCode = replaceImport(result.code, filePath);
          return { code: resultCode };
        }

        if (id.endsWith("?react-router-client-route-module")) {
          const filePath = id.split("?")[0];
          return routeModuleAssets[filePath]["client-route-module"].content;
        }

        if (id.endsWith("?react-router-server-route-module")) {
          const filePath = id.split("?")[0];
          return routeModuleAssets[filePath]["server-route-module"].content;
        }

        // we need to remove exports after client transform for hmr
        // TODO: test case
        // TODO: not sure how hmr would work for non component client exports such as clientLoader/shoudlRevalidate/...
        if (id.endsWith("?react-router-client-route-module-source")) {
          const filePath = id.split("?")[0];
          const exportsToRemove =
            routeModuleAssets[filePath]["client-route-module-source"]
              .exportsToRemove!;
          const ast = babel.parse(code, {
            sourceType: "module",
          });
          removeExports(ast, exportsToRemove);
          const result = babel.generate(ast);
          return { code: result.code };
        }
      },
      hotUpdate: {
        // TODO: this seems necessary to compose better with `@hiogawa/vite-rsc`'s `hotUpdate`
        order: "post",
        handler(ctx) {
          if (this.environment.name === "client") {
            // invalidate only client route source for hmr
            const modules = ctx.modules.filter((m) =>
              m.id?.includes("?react-router-client-route-module-source"),
            );
            if (modules.length > 0) {
              return modules;
            }
          }
        },
      },
    },
  ];
}

const routeModuleAssets: Record<
  string,
  Record<string, { content: string; exportsToRemove?: string[] }>
> = {};

function replaceImport(code: string, filePath: string) {
  return code
    .replaceAll(
      `"client-route-module"`,
      `"${filePath}?react-router-client-route-module"`,
    )
    .replaceAll(
      `"server-route-module"`,
      `"${filePath}?react-router-server-route-module"`,
    )
    .replaceAll(
      `"client-route-module-source"`,
      `"${filePath}?react-router-client-route-module-source"`,
    );
}

function generateRoutes(config: {
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
    code += `lazy: () => import(${JSON.stringify(path.resolve(config.appDirectory, route.file) + "?react-router-route-module")}),`;
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
