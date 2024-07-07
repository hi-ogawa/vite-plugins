import { sortBy, tinyassert } from "@hiogawa/utils";
import type { AnyRouteModule } from "./server";
import { getPathPrefixes } from "./utils";

// generate tree from glob entries such as generated by
//   import.meta.glob("/**/(page|layout|...).(js|jsx|ts|tsx)")
export function createFsRouteTree<T>(globEntries: Record<string, unknown>): {
  entries: Record<string, T>;
  tree: TreeNode<T>;
} {
  const entries: Record<string, T> = {};
  for (const [k, v] of Object.entries(globEntries)) {
    const m = k.match(
      /^(.*)\/(page|layout|error|not-found|loading|template|route)\.\w*$/,
    );
    tinyassert(m && 1 in m && 2 in m);
    const pathname = m[1] || "/";
    (entries[pathname] ??= {} as any)[m[2]] = v;
  }

  const flatTree = Object.entries(entries).map(([k, v]) => ({
    keys: k.replace(/\/+$/, "").split("/"),
    value: v,
  }));
  const tree = createTree(flatTree);

  // sort to match static route first before dynamic route
  sortDynamicRoutes(tree);

  return { entries, tree };
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

export type MatchParamEntry = [key: string | null, value: string];
export type MatchParams = Record<string, string>;

export function toMatchParamsObject(params: MatchParamEntry[]): MatchParams {
  let result: MatchParams = {};
  for (const [k, v] of params) {
    if (k) {
      result[k] = v;
    }
  }
  return result;
}

export type MatchNodeEntry<T> = {
  id?: string;
  prefix: string;
  type: MatchNodeType;
  node: TreeNode<T>;
  params: MatchParamEntry[];
};

type MatchNodeType = "layout" | "page" | "not-found";

export function toRouteId(pathname: string, type: MatchNodeType) {
  return pathname + ":" + type;
}

export type MatchResult<T> = {
  matches: MatchNodeEntry<T>[];
  notFound: boolean;
};

/**
 * @example
 * "/" => [""]
 * "/a" => ["", "a"]
 * "/a/b" => ["", "a", "b"]
 */
function toRawSegments(pathname: string) {
  return ["", ...pathname.slice(1).split("/")];
}

export function fromRawSegments(segments: string[]) {
  return segments.join("/") || "/";
}

export type MatchSegment =
  | {
      type: "static";
      value: string;
    }
  | {
      type: "dynamic";
      key: string;
      value: string;
    }
  | {
      type: "catchall";
      key: string;
      value: string;
    }
  | {
      type: "group";
      key: string;
    }
  // the last match is guranteed to be one of the below
  | {
      type: "not-found";
      value: string;
    }
  | {
      type: "page";
    }
  | {
      type: "route";
    };

type MatchEntry2<T> = {
  node: TreeNode<T>;
  segment: MatchSegment;
};

type MatchResult2<T> = MatchEntry2<T>[] | undefined;

export function toMatchParamEntry(s: MatchSegment) {
  if (s.type === "static") return [null, s.value];
  if (s.type === "dynamic") return [s.key, s.value];
  if (s.type === "catchall") return [s.key, s.value];
  if (s.type === "group") return [null, s.key];
  if (s.type === "not-found") return [null, s.value];
  return [null, null];
}

export function toMatchParams(segments: MatchSegment[]) {
  let result: MatchParams = {};
  for (const s of segments) {
    const [k, v] = toMatchParamEntry(s);
    if (typeof k === "string" && typeof v === "string") {
      result[k] = v;
    }
  }
  return result;
}

export function matchRouteTree2<T extends AnyRouteModule>(
  tree: TreeNode<T>,
  pathname: string,
  leafType: "page" | "route",
): MatchResult2<T> {
  const allSegments = toRawSegments(pathname).map((s) => decodeURI(s));
  const matches = recurse(tree, allSegments);
  // need to fix up not-found after branches tie-break
  // TODO: feels off
  return processNotFound(matches, allSegments);

  //
  // TODO: move outside
  //
  function processNotFound(
    matches: MatchResult2<T>,
    segments: string[],
  ): MatchResult2<T> {
    console.log(matches);
    if (1) return matches;

    if (matches) {
      const last = matches?.at(-1);
      if (last?.segment.type === "not-found") {
        matches.pop();
        const i = matches.findLastIndex((m) => m.node.value?.["not-found"]);
        if (i >= 0) {
          matches = matches.slice(0, i + 1);
          matches.push({
            ...matches[i]!,
            segment: {
              type: "not-found",
              value: segments.slice(i + 1).join("/"),
            },
          });
        } else {
          return;
        }
      }
    }
    return matches;
  }

  function recurse(
    node: TreeNode<T>,
    segments: string[],
  ): MatchEntry2<T>[] | undefined {
    // try all branches for group routes
    const branches: MatchEntry2<T>[][] = [];

    // check page or route
    if (segments.length === 0) {
      branches.push([
        {
          node: node,
          segment: node.value?.[leafType]
            ? {
                type: leafType,
              }
            : {
                type: "not-found",
                value: segments.join("/"),
              },
        },
      ]);
    }

    // recurse children
    for (const { match, nextSegments } of matchChildren(node, segments)) {
      const branch = recurse(match.node, nextSegments);
      if (branch) {
        branches.push([match, ...branch]);
      }
    }

    // not-found
    if (branches.length === 0) {
      branches.push([
        {
          node,
          segment: {
            type: "not-found",
            value: segments.join("/"),
          },
        },
      ]);
    }

    // tie break branches
    return sortBy(branches, (b) => scoreBranch(b))[0];
  }

  function scoreBranch(branch: MatchEntry2<T>[]) {
    const first = branch[0]?.segment.type;
    const last = branch.at(-1)!.segment.type;
    tinyassert(first && last);
    // static = group < dynamic < catchall
    if (first === "dynamic") return 2;
    if (first === "catchall") return 3;
    // TODO
    // static < group if not-found
    // if (first === "group" && last === "not-found") return 1;
    if (last === "not-found") return 1;
    return 0;
  }
}

function matchChildren<T>(node: TreeNode<T>, segments: string[]) {
  const candidates: {
    match: { node: TreeNode<T>; segment: MatchSegment };
    nextSegments: string[];
  }[] = [];
  for (const [key, child] of Object.entries(node.children ?? {})) {
    const mGroup = key.match(GROUP_RE);
    if (mGroup) {
      tinyassert(1 in mGroup);
      candidates.push({
        match: {
          node: child,
          segment: {
            type: "group",
            key: mGroup[1]!,
          },
        },
        nextSegments: segments,
      });
    }
    const matchCatchAll = key.match(CATCH_ALL_RE);
    if (matchCatchAll) {
      candidates.push({
        match: {
          node: child,
          segment: {
            type: "catchall",
            key: matchCatchAll[1]!,
            value: segments.join("/"),
          },
        },
        nextSegments: [],
      });
    }
    const matchDynamic = key.match(DYNAMIC_RE);
    if (matchDynamic) {
      candidates.push({
        match: {
          node: child,
          segment: {
            type: "dynamic",
            key: matchDynamic[1]!,
            value: segments[0]!,
          },
        },
        nextSegments: segments.slice(1),
      });
    }
    if (key === segments[0]) {
      candidates.push({
        match: {
          node: child,
          segment: {
            type: "static",
            value: segments[0]!,
          },
        },
        nextSegments: segments.slice(1),
      });
    }
  }
  return candidates;
}

export function matchRouteTree<T extends AnyRouteModule>(
  tree: TreeNode<T>,
  pathname: string,
  leafType: "page" | "route" = "page",
): MatchResult<T> {
  const prefixes = getPathPrefixes(pathname);

  let node = tree;
  let params: MatchParamEntry[] = [];
  let matches: MatchNodeEntry<T>[] = [];
  let notFound = false;
  for (let i = 0; i < prefixes.length; i++) {
    const prefix = prefixes[i]!;
    const segment = prefix.split("/").at(-1)!;
    const next = matchRouteChild(segment, node);
    if (next) {
      node = next.child;
      if (next.catchAll) {
        const rest = pathname.slice(prefixes[i - 1]!.length + 1);
        params = [...params, [next.param, decodeURI(rest)]];
        matches.push({ prefix: pathname, type: "layout", node, params });
        break;
      }
      if (next.param) {
        params = [...params, [next.param, decodeURI(segment)]];
      } else {
        params = [...params, [null, decodeURI(segment)]];
      }
    } else {
      notFound = true;
      break;
    }
    matches.push({ prefix, type: "layout", node, params });
  }

  // fix up "page" and "not-found"
  if (!notFound) {
    if (matches.at(-1)?.node.value?.[leafType]) {
      matches.push({ ...matches.at(-1)!, type: "page" });
    } else {
      notFound = true;
    }
  }
  if (leafType === "page" && notFound) {
    const i = matches.findLastIndex((m) => m.node.value?.["not-found"]);
    if (i >= 0) {
      matches = matches.slice(0, i + 1);
      matches.push({ ...matches.at(-1)!, type: "not-found" });
    }
  }

  return { matches, notFound };
}

const DYNAMIC_RE = /^\[(\w*)\]$/;
const CATCH_ALL_RE = /^\[\.\.\.(\w*)\]$/;
const GROUP_RE = /^\((\w+)\)$/;

function matchRouteChild<T>(input: string, node: TreeNode<T>) {
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

export function parseRoutePath(pathname: string) {
  const dynamicMap: Record<string, string> = {};

  for (const segment of pathname.split("/")) {
    const mAll = segment.match(CATCH_ALL_RE);
    if (mAll) {
      tinyassert(1 in mAll);
      mAll[1];
      dynamicMap[mAll[1]] = segment;
    }
    const m = segment.match(DYNAMIC_RE);
    if (m) {
      tinyassert(1 in m);
      dynamicMap[m[1]] = segment;
    }
  }

  function format(params: Record<string, string>): string {
    let result = pathname;
    tinyassert(
      isEqualArrayShallow(
        Object.keys(dynamicMap).sort(),
        Object.keys(params).sort(),
      ),
    );
    for (const [k, v] of Object.entries(params)) {
      const segment = dynamicMap[k];
      tinyassert(segment);
      result = result.replace(segment, v);
    }
    return result;
  }

  return {
    dynamic: Object.keys(dynamicMap).length > 0,
    format,
  };
}

function isEqualArrayShallow(xs: unknown[], ys: unknown[]) {
  return xs.length === ys.length && xs.every((x, i) => x === ys[i]);
}

//
// minimal basic tree structure
//

export type TreeNode<T> = {
  value?: T;
  children?: Record<string, TreeNode<T>>;
};

function initTreeNode<T>(): TreeNode<T> {
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
