import { mapRegExp, tinyassert } from "@hiogawa/utils";
import type React from "react";
import type { RouteObject } from "react-router";
import { mapKeys } from "./utils";

type PageModule = {
  Page?: React.ComponentType;
};

export function createGlobPageRoutes(
  root: string,
  globPage: Record<string, PageModule>,
  globLayout: Record<string, PageModule>
): RouteObject[] {
  // TODO: warn invalid usage
  // - no `Page` export
  // - conflicting page/layout e.g. "/hello.page.tsx" and "/hello/layout.tsx"
  globPage = mapKeys(
    globPage,
    (k) => k.slice(root.length).match(/^(.*)\.page\./)![1]!
  );
  globLayout = mapKeys(
    globLayout,
    (k) => k.slice(root.length).match(/^(.*)layout\./)![1]!
  );
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
      const index = path === "index";
      const Component = node.value?.Page ?? null;
      const children = recurse(node.children ?? {});
      return index
        ? {
            index,
            Component,
          }
        : {
            path: formatPath(path),
            Component,
            children,
          };
    });
  }
  return recurse(tree.children ?? {});
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
