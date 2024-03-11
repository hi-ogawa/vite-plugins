import { objectHas, tinyassert } from "@hiogawa/utils";

// cf. similar to vite-glob-routes
// https://github.com/hi-ogawa/vite-plugins/blob/c2d22f9436ef868fc413f05f243323686a7aa143/packages/vite-glob-routes/src/react-router/route-utils.ts#L15-L22

export type RouteNode = TreeNode<{
  page?: React.FC;
  layout?: React.FC<React.PropsWithChildren>;
}>;

// generate component tree from glob import such as
//   import.meta.glob("/**/(page|layout).(js|jsx|ts|tsx)"
export function generateRouteTree(globEntries: Record<string, unknown>) {
  const entries: Record<string, { page?: React.FC; layout?: React.FC }> = {};
  for (const [k, v] of Object.entries(globEntries)) {
    const m = k.match(/^(.*)\/(page|layout)\.\w*$/);
    tinyassert(m && 1 in m && 2 in m);
    tinyassert(objectHas(v, "default"), `no deafult export found in '${k}'`);
    ((entries[m[1]] ??= {}) as any)[m[2]] = v.default;
  }

  const flatTree = Object.entries(entries).map(([k, v]) => ({
    keys: k.split("/"),
    value: v,
  }));
  const tree = createTree(flatTree);
  return tree;
}

type MatchRouteResult = {
  nodes: RouteNode[];
  notFound: boolean;
  params: Record<string, string>;
};

export function matchRoute(
  pathname: string,
  tree: RouteNode
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

function matchChild(input: string, node: RouteNode) {
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
