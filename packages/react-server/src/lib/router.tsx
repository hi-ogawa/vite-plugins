import { objectHas, tinyassert } from "@hiogawa/utils";
import React from "react";
import { type ReactServerErrorContext, createError } from "./error";
import { __global } from "./global";
import { getPathPrefixes, normalizePathname } from "./utils";

// cf. https://nextjs.org/docs/app/building-your-application/routing#file-conventions
interface RouteEntry {
  page?: {
    default: React.FC<PageProps>;
  };
  layout?: {
    default: React.FC<LayoutProps>;
  };
  error?: {
    // TODO: warn if no "use client"
    default: React.FC<ErrorPageProps>;
  };
}

type RouteTreeNode = TreeNode<RouteEntry>;

// generate component tree from glob import such as
//   import.meta.glob("/**/(page|layout).(js|jsx|ts|tsx)"
export function generateRouteTree(globEntries: Record<string, unknown>) {
  const entries: Record<string, RouteEntry> = {};
  for (const [k, v] of Object.entries(globEntries)) {
    const m = k.match(/^(.*)\/(page|layout|error)\.\w*$/);
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
  tree: RouteTreeNode,
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

// use own "use client" components as external
function importClientInternal(): Promise<typeof import("../client-internal")> {
  return import("@hiogawa/react-server/client-internal" as string);
}

function renderPage(node: RouteTreeNode, props: PageProps) {
  const Page = node.value?.page?.default ?? ThrowNotFound;
  return <Page {...props} />;
}

async function renderLayout(
  node: RouteTreeNode,
  props: PageProps,
  name: string,
) {
  const { ErrorBoundary, LayoutContent } = await importClientInternal();

  let acc = <LayoutContent name={name} />;
  const ErrorPage = node.value?.error?.default;
  if (ErrorPage) {
    // TODO: can we remove extra <div>?
    acc = (
      <ErrorBoundary errorComponent={ErrorPage}>
        <div className="error-boundary">{acc}</div>
      </ErrorBoundary>
    );
  }
  const Layout = node.value?.layout?.default;
  if (Layout) {
    return <Layout {...props}>{acc}</Layout>;
  }
  return acc;
}

// TODO: test
export async function renderRoutes(tree: RouteTreeNode, request: Request) {
  const url = new URL(request.url);
  const pathname = normalizePathname(url.pathname);
  const prefixes = getPathPrefixes(pathname);

  let node = tree;
  let params: BaseProps["params"] = {};
  const pages: Record<string, React.ReactNode> = {};
  const layouts: Record<string, React.ReactNode> = {};
  for (const [prefix, key] of prefixes) {
    const next = matchChild(key, node);
    if (next?.child) {
      node = next.child;
      if (next.param) {
        params = { ...params, [next.param]: key };
      }
    } else {
      node = initNode();
    }
    const props: BaseProps = { request, params };
    layouts[prefix] = await renderLayout(node, props, prefix);
    if (prefix === pathname) {
      pages[prefix] = renderPage(node, props);
    }
  }

  return { pages, layouts };
}

const ThrowNotFound: React.FC = () => {
  throw createError({ status: 404 });
};

interface BaseProps {
  // TODO: parsed url prop?
  request: Request; // TODO: "use client" page/layout doesn't have full aceess
  params: Record<string, string>;
}

export interface PageProps extends BaseProps {}

export interface LayoutProps extends React.PropsWithChildren<BaseProps> {}

export interface ErrorPageProps {
  error: Error;
  serverError?: ReactServerErrorContext;
  reset: () => void;
}

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
// general tree utils copied from vite-glob-routes
// https://github.com/hi-ogawa/vite-plugins/blob/c2d22f9436ef868fc413f05f243323686a7aa143/packages/vite-glob-routes/src/react-router/route-utils.ts#L15-L22
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
