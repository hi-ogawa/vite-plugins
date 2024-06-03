import { sortBy, tinyassert } from "@hiogawa/utils";
import { getPathPrefixes, normalizePathname } from "./utils";

export interface BaseRouteEntry<T> {
  page?: T;
  layout?: T;
  error?: T;
}

// generate tree from glob entries such as generated by
//   import.meta.glob("/**/(page|layout|error).(js|jsx|ts|tsx)")
export function createFsRouteTree<T>(
  globEntries: Record<string, T>,
): TreeNode<BaseRouteEntry<T>> {
  const entries: Record<string, BaseRouteEntry<T>> = {};
  for (const [k, v] of Object.entries(globEntries)) {
    const m = k.match(/^(.*)\/(page|layout|error)\.\w*$/);
    tinyassert(m && 1 in m && 2 in m);
    ((entries[m[1]] ??= {}) as any)[m[2]] = v;
  }

  const flatTree = Object.entries(entries).map(([k, v]) => ({
    keys: k.split("/"),
    value: v,
  }));
  const tree = createTree(flatTree);

  // sort to match static route first before dynamic route
  sortDynamicRoutes(tree);

  return tree;
}

function sortDynamicRoutes<T>(tree: TreeNode<T>) {
  if (tree.children) {
    tree.children = Object.fromEntries(
      sortBy(Object.entries(tree.children), ([k]) => k.includes("[")),
    );
    for (const v of Object.values(tree.children)) {
      sortDynamicRoutes(v);
    }
  }
}

type MatchNodeEntry<T> = {
  prefix: string;
  type: "layout" | "page";
  node: TreeNode<T>;
  params: Record<string, string>;
};

type MatchResult<T> = {
  matches: MatchNodeEntry<T>[];
};

export function matchRouteTree<T>(tree: TreeNode<T>, pathname: string) {
  // TODO: more uniform handling of trailing slash
  pathname = normalizePathname(pathname);
  const prefixes = getPathPrefixes(pathname);

  let node = tree;
  let params: Record<string, string> = {};
  const result: MatchResult<T> = { matches: [] };
  for (let i = 0; i < prefixes.length; i++) {
    const prefix = prefixes[i]!;
    const segment = prefix.split("/").at(-1)!;
    const next = matchRouteChild(segment, node);
    if (next?.child) {
      node = next.child;
      if (next.catchAll) {
        const rest = pathname.slice(prefixes[i - 1]!.length + 1);
        params = { ...params, [next.param]: decodeURI(rest) };
        result.matches.push({ prefix, type: "layout", node, params });
        for (const prefix of prefixes.slice(i)) {
          result.matches.push({
            prefix,
            type: "layout",
            node: initTreeNode(),
            params,
          });
        }
        result.matches.push({ prefix, type: "page", node, params });
        break;
      }
      if (next.param) {
        params = { ...params, [next.param]: decodeURI(segment) };
      }
    } else {
      node = initTreeNode();
    }
    result.matches.push({ prefix, type: "layout", node, params });
    if (prefix === pathname) {
      result.matches.push({ prefix, type: "page", node, params });
    }
  }
  return result;
}

const DYNAMIC_RE = /^\[(\w*)\]$/;
const CATCH_ALL_RE = /^\[\.\.\.(\w*)\]$/;

export function matchRouteChild<T>(input: string, node: TreeNode<T>) {
  if (!node.children) {
    return;
  }
  for (const [segment, child] of Object.entries(node.children)) {
    const mAll = segment.match(CATCH_ALL_RE);
    if (mAll) {
      tinyassert(1 in mAll);
      return { param: mAll[1], child, catchAll: true };
    }
    const m = segment.match(DYNAMIC_RE);
    if (m) {
      tinyassert(1 in m);
      return { param: m[1], child };
    }
    if (segment === input) {
      return { child };
    }
  }
  return;
}

//
// general tree utils copied from vite-glob-routes
// https://github.com/hi-ogawa/vite-plugins/blob/c2d22f9436ef868fc413f05f243323686a7aa143/packages/vite-glob-routes/src/react-router/route-utils.ts#L15-L22
//

export type TreeNode<T> = {
  value?: T;
  children?: Record<string, TreeNode<T>>;
};

export function initTreeNode<T>(): TreeNode<T> {
  return {};
}

function createTree<T>(entries: { value: T; keys: string[] }[]): TreeNode<T> {
  const root = initTreeNode<T>();

  for (const e of entries) {
    let node = root;
    for (const key of e.keys) {
      node = (node.children ??= {})[key] ??= initTreeNode();
    }
    node.value = e.value;
  }

  return root;
}
