import { sortBy, tinyassert, typedBoolean } from "@hiogawa/utils";
import type { AnyRouteModule } from "./server";

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

  return { entries, tree };
}

export type MatchParamEntry = [key: string | null, value: string];
export type MatchParams = Record<string, string>;

export function toMatchParamsObject(segments: MatchSegment[]): MatchParams {
  return Object.assign({}, ...segments.map((s) => matchSegmentToParams(s)));
}

/**
 * @example
 * "/" => [""]
 * "/a" => ["", "a"]
 * "/a/b" => ["", "a", "b"]
 */
function toRawSegments(pathname: string): string[] {
  return pathname === "/" ? [""] : pathname.split("/");
}

export function fromRawSegments(segments: string[]): string {
  return segments.join("/") || "/";
}

// TODO: "segment" is confusing? matchType? matchEntry? VirtualSegment?
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
      value: string;
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

function matchSegmentToParams(s: MatchSegment): MatchParams {
  return s.type === "dynamic" || s.type === "catchall"
    ? { [s.key]: s.value }
    : {};
}

type MatchEntry2<T> = {
  node: TreeNode<T>;
  segment: MatchSegment;
};

export type MatchEntry3<T> = {
  node: TreeNode<T>;
  id: string;
  path: string; // TODO: rename to "key"? note that this `path` contains group segment e.g. /x/(g)/z
  type: "layout" | "page" | "not-found";
  params: MatchSegment[];
};

export type MatchRouteResult3<T> = {
  matches: MatchEntry3<T>[];
  params: MatchSegment[];
  notFound: boolean;
};

export function matchRouteTree3<T extends AnyRouteModule>(
  tree: TreeNode<T>,
  pathname: string,
): MatchRouteResult3<T> {
  const matches = matchRouteTree2(tree, pathname, "page");
  tinyassert(matches && matches.length > 0);
  const segments = matches.map((m) => m.segment);
  const allParams = toMatchParamEntries(segments);
  const matches3 = matches.map((m, i) => {
    const params = allParams.slice(0, i + 1);
    const path = fromRawSegments(params.map(([_k, v]) => v));
    const type =
      m.segment.type === "page"
        ? "page"
        : m.segment.type === "not-found"
          ? "not-found"
          : "layout";
    const id = `${path}:${type}`;
    return {
      id,
      path,
      type,
      params: segments.slice(0, i + 1),
      node: m.node,
    } satisfies MatchEntry3<T>;
  });
  return {
    matches: matches3,
    params: segments,
    notFound: segments.at(-1)?.type === "not-found",
  };
}

type MatchResult2<T> = MatchEntry2<T>[] | undefined;

export function toMatchParamEntry(
  s: MatchSegment,
): MatchParamEntry | undefined {
  if (s.type === "static") return [null, s.value];
  if (s.type === "dynamic") return [s.key, s.value];
  if (s.type === "catchall") return [s.key, s.value];
  if (s.type === "group") return [null, s.value];
  if (s.type === "not-found") return [null, s.value];
  return;
}

export function toMatchParamEntries(
  segments: MatchSegment[],
): MatchParamEntry[] {
  return segments.map((param) => toMatchParamEntry(param)).filter(typedBoolean);
}

export function matchRouteTree2<T extends AnyRouteModule>(
  tree: TreeNode<T>,
  pathname: string,
  leafType: "page" | "route",
): MatchResult2<T> {
  return recurse(
    tree,
    toRawSegments(pathname).map((s) => decodeURI(s)),
  );

  function recurse(
    node: TreeNode<T>,
    segments: string[],
  ): MatchEntry2<T>[] | undefined {
    // try all branches for group routes
    const branches: MatchEntry2<T>[][] = [];

    // check page or route
    if (segments.length === 0 && node.value?.[leafType]) {
      branches.push([
        {
          node: node,
          segment: {
            type: leafType,
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

    // check not-found
    if (node.value?.["not-found"]) {
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
}

function scoreBranch<T>(branch: MatchEntry2<T>[]) {
  const first = branch[0]?.segment.type;
  const last = branch.at(-1)!.segment.type;
  tinyassert(first && last);
  // static = group < dynamic < catchall
  if (first === "dynamic") return 2;
  if (first === "catchall") return 3;
  // static < group if not-found
  if (last === "not-found") {
    if (first === "group") return 1.5;
    return 1;
  }
  return 0;
}

function matchChildren<T>(node: TreeNode<T>, segments: string[]) {
  const candidates: {
    match: { node: TreeNode<T>; segment: MatchSegment };
    nextSegments: string[];
  }[] = [];
  for (const [key, child] of Object.entries(node.children ?? {})) {
    const mGroup = key.match(GROUP_RE);
    if (mGroup) {
      candidates.push({
        match: {
          node: child,
          segment: {
            type: "group",
            value: key,
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

const DYNAMIC_RE = /^\[(\w*)\]$/;
const CATCH_ALL_RE = /^\[\.\.\.(\w*)\]$/;
const GROUP_RE = /^\((\w+)\)$/;

// TODO: support ssg with route groups
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
