import { objectHas, sortBy, tinyassert } from "@hiogawa/utils";
import React from "react";
import { getPathPrefixes, normalizePathname } from "../features/router/utils";
import { type ReactServerErrorContext, createError } from "./error";

// TODO: move to features/router/react-server

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

// use own "use client" components as external
function importRuntimeClient(): Promise<typeof import("../runtime-client")> {
  return import("@hiogawa/react-server/runtime-client" as string);
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
  const { ErrorBoundary, RedirectBoundary, LayoutContent } =
    await importRuntimeClient();

  let acc = <LayoutContent name={name} />;
  acc = <RedirectBoundary>{acc}</RedirectBoundary>;

  const ErrorPage = node.value?.error?.default;
  if (ErrorPage) {
    acc = <ErrorBoundary errorComponent={ErrorPage}>{acc}</ErrorBoundary>;
  }
  const Layout = node.value?.layout?.default;
  if (Layout) {
    return <Layout {...props}>{acc}</Layout>;
  }
  return acc;
}

export async function renderRouteMap(
  tree: RouteTreeNode,
  request: Pick<Request, "url" | "headers">,
) {
  const url = serializeUrl(new URL(request.url));
  const pathname = normalizePathname(url.pathname);
  const prefixes = getPathPrefixes(pathname);

  let node = tree;
  let params: BaseProps["params"] = {};
  const pages: Record<string, React.ReactNode> = {};
  const layouts: Record<string, React.ReactNode> = {};
  for (const prefix of prefixes) {
    const key = prefix.split("/").at(-1)!;
    const next = matchChild(key, node);
    if (next?.child) {
      node = next.child;
      if (next.param) {
        params = { ...params, [next.param]: decodeURI(key) };
      }
    } else {
      node = initNode();
    }
    const props: BaseProps = {
      url,
      request: {
        url: request.url,
        headers: serializeHeaders(request.headers),
      },
      params,
    };
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

type SerializedURL = {
  [k in keyof URL]: URL[k] extends string ? URL[k] : never;
};

function serializeUrl(url: URL): SerializedURL {
  const kv: any = {};
  for (const k in url) {
    const v = (url as any)[k];
    if (typeof v === "string") {
      kv[k] = v;
    }
  }
  return kv;
}

function serializeHeaders(headers: Headers): Record<string, string> {
  const kv: Record<string, string> = {};
  headers.forEach((v, k) => (kv[k] = v));
  return kv;
}

interface BaseProps {
  url: SerializedURL;
  request: {
    url: string;
    headers: Record<string, string>;
  };
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
