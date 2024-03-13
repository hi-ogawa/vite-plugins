import { objectHas, tinyassert } from "@hiogawa/utils";
import type React from "react";

// TODO: rename to router

// cf. similar to vite-glob-routes
// https://github.com/hi-ogawa/vite-plugins/blob/c2d22f9436ef868fc413f05f243323686a7aa143/packages/vite-glob-routes/src/react-router/route-utils.ts#L15-L22

// cf. https://nextjs.org/docs/app/building-your-application/routing#file-conventions
interface RouteEntry {
  page?: {
    default: React.FC<PageRouteProps>;
  };
  layout?: {
    default: React.FC<LayoutRouteProps>;
  };
}

type RouteTreeNode = TreeNode<RouteEntry>;

// generate component tree from glob import such as
//   import.meta.glob("/**/(page|layout).(js|jsx|ts|tsx)"
export function generateRouteTree(globEntries: Record<string, unknown>) {
  const entries: Record<string, RouteEntry> = {};
  for (const [k, v] of Object.entries(globEntries)) {
    const m = k.match(/^(.*)\/(page|layout)\.\w*$/);
    tinyassert(m && 1 in m && 2 in m);
    tinyassert(objectHas(v, "default"), `no deafult export found in '${k}'`);
    ((entries[m[1]] ??= {}) as any)[m[2]] = v;
  }

  const flatTree = Object.entries(entries).map(([k, v]) => ({
    keys: k.split("/"),
    value: v,
  }));
  const tree = createTree(flatTree);
  return tree;
}

export type MatchRouteResult = {
  nodes: RouteTreeNode[];
  notFound: boolean;
  params: Record<string, string>;
};

export function matchRoute(
  pathname: string,
  tree: RouteTreeNode
): MatchRouteResult {
  let node = tree;
  const result: MatchRouteResult = {
    nodes: [],
    notFound: false,
    params: {},
  };
  // strip trailing slash
  const keys = pathname.replaceAll(/\/*$/g, "").split("/");
  for (const key of keys) {
    const next = matchChild(key, node);
    if (next?.child) {
      node = next.child;
      result.nodes.push(node);
      if (next.param) {
        result.params[next.param] = key;
      }
      continue;
    }
    result.notFound = true;
    break;
  }
  return result;
}

// TODO: separate react code in a different file
export function renderMatchRoute(
  match: MatchRouteResult,
  fallback: React.ReactNode
): React.ReactNode {
  const nodes = [...match.nodes].reverse();
  const props: RouteProps = { match };

  let acc: React.ReactNode = fallback;
  if (!match.notFound) {
    // TODO: assert?
    const Page = nodes[0]?.value?.page?.default;
    if (Page) {
      acc = <Page {...props} />;
    }
  }

  for (const node of nodes) {
    const Layout = node.value?.layout?.default;
    if (Layout) {
      acc = <Layout {...props}>{acc}</Layout>;
    }
  }

  return acc;
}

interface RouteProps {
  match: MatchRouteResult;
}

export interface PageRouteProps extends RouteProps {}

export interface LayoutRouteProps extends React.PropsWithChildren<RouteProps> {}

function matchChild(input: string, node: RouteTreeNode) {
  if (!node.children) {
    return;
  }
  // TODO: sort to dynmaic one come last
  // TODO: catch-all route
  for (const [segment, child] of Object.entries(node.children)) {
    const m = segment.match(/^\[(.*)\]$/);
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
// general tree structure utils
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
