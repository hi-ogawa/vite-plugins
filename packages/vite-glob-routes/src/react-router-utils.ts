import { mapRegExp, tinyassert } from "@hiogawa/utils";
import type { RouteObject } from "react-router";
import { mapValues } from "./utils";

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

export function createGlobPageRoutes(internal: GlobPageRoutesInternal) {
  // TODO: warn invalid usage
  // - ensure `Component` export
  // - conflicting page/layout e.g. "/hello.page.tsx" and "/hello/layout.tsx"

  const mapping = createGlobPageMapping(internal);

  const pageModules = mapValues(mapping, (entries) => async () => {
    const resolved = await Promise.all(entries.map((e) => e.lazy));
    return Object.assign({}, ...resolved);
  });

  const routes = createGlobPageRoutesInner(pageModules);
  return { routes, mapping };
}

// provide mapping from file system path to module path
// (urlpath => filepath => module)
type GlobPageMapping = Record<
  string,
  { filepath: string; lazy: LazyPageModule }[]
>;

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
    for (const [filepath, lazy] of Object.entries(glob)) {
      const urlpath = filepath.slice(internal.root.length).match(regex)![1]!;
      (result[urlpath] ??= []).push({ filepath, lazy });
    }
  }

  return result;
}

function createGlobPageRoutesInner(
  pageModules: Record<string, LazyPageModule>
): RouteObject[] {
  // construct general tree structure
  const pathEntries = Object.entries(pageModules).map(([k, v]) => ({
    keys: splitPathSegment(k),
    value: v,
  }));
  const tree = createTree(pathEntries);

  // transform to react-router's nested RouteObject array
  function recurse(
    children: Record<string, TreeNode<LazyPageModule>>
  ): RouteObject[] {
    return Object.entries(children).map(([path, node]) => {
      const route: RouteObject = {
        ...node.value,
        path: formatPath(path),
        lazy: node.value,
      };
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
