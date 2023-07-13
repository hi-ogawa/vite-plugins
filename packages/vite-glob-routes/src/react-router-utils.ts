import { mapRegExp, tinyassert } from "@hiogawa/utils";
import type { RouteObject } from "react-router";

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

export type GlobPageRoutesUserOptions = {
  // allow patching each route e.g.
  // - for auto injecting `proxyServerLoader` as client loader
  // - for wrapping server loader with consistent error handling
  transformRoute?: (route: RouteObjectWithGlobInfo) => RouteObjectWithGlobInfo;
};

// expose extra data for the use of modulepreload etc...
// note that the entries are different between client and server build since client doesn't include "*.page.server.js"
export type RouteObjectWithGlobInfo = RouteObject & {
  globInfo?: {
    entries: GlobPageMappingEntry[];
  };
};

type GlobPageRoutesResult = {
  routes: RouteObjectWithGlobInfo[];
};

export function createGlobPageRoutes(
  internal: GlobPageRoutesInternal,
  options: GlobPageRoutesUserOptions
): GlobPageRoutesResult {
  // TODO: warn invalid usage
  // - ensure `Component` export
  // - conflicting page/layout e.g. "/hello.page.tsx" and "/hello/layout.tsx"
  const mapping = createGlobPageMapping(internal);
  const routes = createGlobPageRoutesInner(internal.eager, mapping, options);
  return { routes };
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
  internal: GlobPageRoutesInternal
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
  options: GlobPageRoutesUserOptions
): RouteObjectWithGlobInfo[] {
  // construct general tree structure
  const pathEntries = Object.entries(mapping).map(([k, v]) => ({
    keys: splitPathSegment(k),
    value: v,
  }));
  const tree = createTree(pathEntries);

  // transform to react-router's nested RouteObject array
  function recurse(
    children: Record<string, TreeNode<GlobPageMappingEntry[]>>
  ): RouteObjectWithGlobInfo[] {
    return Object.entries(children).map(([path, node]) => {
      const route: RouteObjectWithGlobInfo = {
        path: formatPath(path),
      };
      if (node.value) {
        const entries = node.value;
        route.globInfo = { entries };
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
              })
            );
            return Object.assign({}, ...mods);
          };
        }
      }
      if (node.children) {
        route.children = recurse(node.children);
      }
      if (path === "index") {
        // silence tricky "index: true" typing
        route.index = true as false;
        delete route.path;
        delete route.children;
      }
      if (options.transformRoute) {
        return options.transformRoute(route);
      }
      return route;
    });
  }
  return tree.children ? recurse(tree.children) : [];
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
    }
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
