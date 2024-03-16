import { mapRegExp, tinyassert } from "@hiogawa/utils";
import type { DataRouteObject, RouteObject } from "react-router";

// mirror everything from react-router and used as `RouteObject.lazy`.
type PageModule = Omit<RouteObject, "index" | "path" | "children" | "lazy">;
type LazyPageModule = () => Promise<PageModule>;
type GlobImporModule = PageModule | LazyPageModule;

// provided by plugin's virtual module based on glob import
export type GlobPageRoutesInternal = {
  eager: boolean;
  root: string;
  globPage: Record<string, GlobImporModule>;
  globPageServer: Record<string, GlobImporModule>;
  globLayout: Record<string, GlobImporModule>;
  globLayoutServer: Record<string, GlobImporModule>;
};

export type GlobPageRoutesResult = {
  routes: DataRouteObject[];
  routesMeta: RoutesMeta;
};

export type RoutesMeta = {
  [routeId: string]: {
    route: DataRouteObject;
    entries: GlobPageMappingEntry[];
  };
};

export function createGlobPageRoutes(
  internal: GlobPageRoutesInternal,
): GlobPageRoutesResult {
  // TODO: warn invalid usage
  // - ensure `Component` export
  // - conflicting page/layout e.g. "/hello.page.tsx" and "/hello/layout.tsx"
  // - `hello.page.server.tsx` without `hello.page.tsx`
  const mapping = createGlobPageMapping(internal);
  return createGlobPageRoutesInner(internal.eager, mapping);
}

// mapping between url path and file system path
// (urlpath => filepath => module)
type GlobPageMapping = Record<string, GlobPageMappingEntry[]>;
type GlobPageMappingEntry = {
  file: string;
  mod: GlobImporModule;
  isServer: boolean;
};

function createGlobPageMapping(
  internal: GlobPageRoutesInternal,
): GlobPageMapping {
  const patterns = [
    [internal.globPage, /^(.*)\.page\./, false],
    [internal.globPageServer, /^(.*)\.page\.server\./, true],
    [internal.globLayout, /^(.*)layout\./, false],
    [internal.globLayoutServer, /^(.*)layout\.server\./, true],
  ] as const;

  const result: GlobPageMapping = {};

  for (const [glob, regex, isServer] of patterns) {
    for (const [file, mod] of Object.entries(glob)) {
      const urlpath = file.slice(internal.root.length).match(regex)![1]!;
      (result[urlpath] ??= []).push({ file, mod, isServer });
    }
  }

  return result;
}

function createGlobPageRoutesInner(
  eager: boolean,
  mapping: GlobPageMapping,
): GlobPageRoutesResult {
  // construct general tree structure
  const pathEntries = Object.entries(mapping).map(([k, v]) => ({
    keys: splitPathSegment(k),
    value: v,
  }));
  const tree = createTree(pathEntries);

  // transform to react-router's nested RouteObject array
  // with assigning "id" on our own to allow manipulating routes easily
  const routesMeta: GlobPageRoutesResult["routesMeta"] = {};

  function recurse(
    children: Record<string, TreeNode<GlobPageMappingEntry[]>>,
    idPath: string[],
  ): DataRouteObject[] {
    return Object.entries(children).map(([path, node]) => {
      // similar to convertRoutesToDataRoutes https://github.com/remix-run/react-router/blob/5b1765f54ee1f769b23c4ded3ad02f04a34e636e/packages/router/utils.ts#L389
      // but we use "file path" directly instead of index based encoding
      // since this would help DX for internal debugging (e.g. data request encoding in wrapLoaderRequest)
      const idPathNext = [...idPath, path];
      const id = idPathNext.join("");

      const route: DataRouteObject = {
        id,
        path: formatPath(path),
      };
      let entries: GlobPageMappingEntry[] = [];

      if (node.value) {
        entries = node.value;
        if (eager) {
          const mods = entries.map((e) => {
            tinyassert(typeof e.mod !== "function");
            return e.mod satisfies PageModule;
          });
          Object.assign(route, ...mods);
        } else {
          route.lazy = async () => {
            const mods = await Promise.all(
              entries.map((e) => {
                tinyassert(typeof e.mod === "function");
                return (e.mod satisfies LazyPageModule)();
              }),
            );
            return Object.assign({}, ...mods);
          };
        }
      }
      if (node.children) {
        route.children = recurse(node.children, idPathNext);
      }
      if (path === "index") {
        // silence tricky "index: true" typing
        route.index = true as false;
        delete route.path;
        delete route.children;
      }
      routesMeta[id] = {
        route,
        entries,
      };
      return route;
    });
  }

  const routes = tree.children ? recurse(tree.children, []) : [];
  return { routes, routesMeta };
}

//
// utils
//

type TreeNode<T> = {
  value?: T;
  children?: Record<string, TreeNode<T>>;
};

function initNode<T>(): TreeNode<T> {
  return {};
}

function createTree<T>(entries: { value: T; keys: string[] }[]): TreeNode<T> {
  const root = initNode<T>();

  for (const e of entries) {
    let node = root;
    for (const key of e.keys) {
      node = (node.children ??= {})[key] ??= initNode();
    }
    node.value = e.value;
  }

  return root;
}

//
// it can be used to create "route manifest" on your own e.g. by
//
//   const manifest = {};
//   walkArrayTree(routes as DataRouteObject[], (route) => {
//     manifest[route.id] = route;
//   });
//
export function walkArrayTree<T extends { children?: T[] }>(
  roots: T[],
  // TODO: support "afterFn" too?
  beforeFn: (v: T) => void,
) {
  for (const node of roots) {
    beforeFn(node);
    if (node.children) {
      walkArrayTree(node.children, beforeFn);
    }
  }
}

// "/" => ["/"]
// "/xyz" => ["/", "xyz"]
// "/abc/def" => ["/", "abc/", "def"]
export function splitPathSegment(pathname: string): string[] {
  const result: string[] = [];
  mapRegExp(
    pathname,
    /([^/]*\/)/g,
    (match) => {
      tinyassert(1 in match);
      result.push(match[1]);
    },
    (nonMatch) => {
      result.push(nonMatch);
    },
  );
  return result;
}

// "[dynamic]" => ":dynamic"
// "[dynamicdir]/" => ":dynamicdir/"
function formatPath(s: string): string {
  const m = s.match(/^\[(.*)\](\/?)$/);
  if (m) {
    return ":" + m[1] + (m[2] ?? "");
  }
  return s;
}
