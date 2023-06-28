import { mapRegExp, tinyassert } from "@hiogawa/utils";
import type { RouteObject } from "react-router";

// mirror everything from react-router and used as `RouteObject.lazy`.
type PageModule = Omit<RouteObject, "index" | "path" | "children" | "lazy">;

export type LazyPageModule = () => Promise<PageModule>;

// provided by plugin's virtual module based on glob import
export type GlobPageRoutesInternal = {
  root: string;
  globPage: Record<string, LazyPageModule>;
  globPageServer: Record<string, LazyPageModule>;
  globLayout: Record<string, LazyPageModule>;
  globLayoutServer: Record<string, LazyPageModule>;
};

// expose extra data for the use of modulepreload etc...
export type RouteObjectWithGlobInfo = RouteObject & {
  globInfo?: {
    entries: GlobPageMappingEntry[];
  };
};

export type GlobPageRoutesResult = {
  routes: RouteObjectWithGlobInfo[];
};

export function createGlobPageRoutes(
  internal: GlobPageRoutesInternal
): GlobPageRoutesResult {
  // TODO: warn invalid usage
  // - ensure `Component` export
  // - conflicting page/layout e.g. "/hello.page.tsx" and "/hello/layout.tsx"
  const mapping = createGlobPageMapping(internal);
  const routes = createGlobPageRoutesInner(mapping);
  return { routes };
}

// mapping between url path and file system path
// (urlpath => filepath => module)
type GlobPageMapping = Record<string, GlobPageMappingEntry[]>;
type GlobPageMappingEntry = { file: string; mod: LazyPageModule };

function createGlobPageMapping(
  internal: GlobPageRoutesInternal
): GlobPageMapping {
  const patterns = [
    [internal.globPage, /^(.*)\.page\./],
    [internal.globPageServer, /^(.*)\.page\.server\./],
    [internal.globLayout, /^(.*)layout\./],
    [internal.globLayoutServer, /^(.*)layout\.server\./],
  ] as const;

  const result: GlobPageMapping = {};

  for (const [glob, regex] of patterns) {
    for (const [file, mod] of Object.entries(glob)) {
      const urlpath = file.slice(internal.root.length).match(regex)![1]!;
      (result[urlpath] ??= []).push({ file, mod });
    }
  }

  return result;
}

function createGlobPageRoutesInner(
  mapping: GlobPageMapping
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
        route.lazy = async () => {
          const mods = await Promise.all(entries.map((e) => e.mod()));
          return Object.assign({}, ...mods);
        };
        route.globInfo = { entries };
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
