import { mapRegExp, tinyassert } from "@hiogawa/utils";
import type { RouteObject } from "react-router";
import { mapKeys } from "./utils";

// mirror everything from react-router
export type PageModule = Omit<
  RouteObject,
  "index" | "path" | "children" | "lazy"
>;

// provided by plugin's virtual module based on glob import
export type GlobPageRoutesInternal = {
  root: string;
  globPage: Record<string, PageModule>;
  globPageServer: Record<string, PageModule>;
  globLayout: Record<string, PageModule>;
  globLayoutServer: Record<string, PageModule>;
};

export function createGlobPageRoutes({
  root,
  globPage,
  globPageServer,
  globLayout,
  globLayoutServer,
}: GlobPageRoutesInternal): RouteObject[] {
  // TODO: warn invalid usage
  // - ensure `Component` export
  // - conflicting page/layout e.g. "/hello.page.tsx" and "/hello/layout.tsx"
  globPage = mapKeys(
    globPage,
    (k) => k.slice(root.length).match(/^(.*)\.page\./)![1]!
  );
  globLayout = mapKeys(
    globLayout,
    (k) => k.slice(root.length).match(/^(.*)layout\./)![1]!
  );
  globPageServer = mapKeys(
    globPageServer,
    (k) => k.slice(root.length).match(/^(.*)\.page\.server\./)![1]!
  );
  globLayoutServer = mapKeys(
    globLayoutServer,
    (k) => k.slice(root.length).match(/^(.*)layout\.server\./)![1]!
  );
  for (const [k, v] of Object.entries(globPageServer)) {
    const v2 = globPage[k];
    tinyassert(v2);
    globPage[k] = { ...v2, ...v };
  }
  for (const [k, v] of Object.entries(globLayoutServer)) {
    const v2 = globLayout[k];
    tinyassert(v2);
    globLayout[k] = { ...v2, ...v };
  }
  return createGlobPageRoutesInner({ ...globPage, ...globLayout });
}

function createGlobPageRoutesInner(
  pageModules: Record<string, PageModule>
): RouteObject[] {
  // construct general tree structure
  const pathEntries = Object.entries(pageModules).map(([k, v]) => ({
    keys: splitPathSegment(k),
    value: v,
  }));
  const tree = createTree(pathEntries);

  // transform to react-router's nested RouteObject array
  function recurse(
    children: Record<string, TreeNode<PageModule>>
  ): RouteObject[] {
    return Object.entries(children).map(([path, node]) => {
      const route: RouteObject = {
        ...node.value,
        path: formatPath(path),
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
