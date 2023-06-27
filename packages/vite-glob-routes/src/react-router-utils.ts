import { mapRegExp, tinyassert } from "@hiogawa/utils";
import type { RouteObject } from "react-router";
import { mapKeys } from "./utils";

// mirror everything from react-router and used as `RouteObject.lazy`.
export type PageModule = Omit<
  RouteObject,
  "index" | "path" | "children" | "lazy"
>;

export type LazyPageModule = () => Promise<PageModule>;

export function createGlobPageRoutes({
  root,
  globPage,
  globPageServer,
  globLayout,
  globLayoutServer,
}: {
  root: string;
  globPage: Record<string, LazyPageModule>;
  globPageServer: Record<string, LazyPageModule>;
  globLayout: Record<string, LazyPageModule>;
  globLayoutServer: Record<string, LazyPageModule>;
}): RouteObject[] {
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
  for (const [k, v1] of Object.entries(globPageServer)) {
    const v2 = globPage[k];
    tinyassert(v2);
    globPage[k] = async () => ({ ...(await v2()), ...(await v1()) });
  }
  for (const [k, v1] of Object.entries(globLayoutServer)) {
    const v2 = globLayout[k];
    tinyassert(v2);
    globLayout[k] = async () => ({ ...(await v2()), ...(await v1()) });
  }
  return createGlobPageRoutesInner({ ...globPage, ...globLayout });
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
        path: formatPath(path),
        children: recurse(node.children ?? {}),
        lazy: node.value,
      };
      if (path === "index") {
        // silence convoluted "index: true" typing
        route.index = true as false;
        delete route.path;
        delete route.children;
      }
      return route;
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
