import { objectHas, tinyassert } from "@hiogawa/utils";
import React from "react";
import {
  type TreeNode,
  initTreeNode,
  matchRouteChild,
} from "../features/router/tree";
import { getPathPrefixes, normalizePathname } from "../features/router/utils";
import { type ReactServerErrorContext, createError } from "./error";
import { __global } from "./global";

// TODO: move to features/router

// cf. https://nextjs.org/docs/app/building-your-application/routing#file-conventions
interface RouteEntry {
  page?: () => Promise<{
    default: React.FC<PageProps>;
  }>;
  layout?: () => Promise<{
    default: React.FC<LayoutProps>;
  }>;
  error?: () => Promise<{
    // TODO: warn if no "use client"
    default: React.FC<ErrorPageProps>;
  }>;
}

export type RouteTreeNode = TreeNode<RouteEntry>;

async function importDefault<T>(
  lazyMod?: () => Promise<{ default: T }>,
): Promise<T | undefined> {
  if (lazyMod) {
    const mod = await lazyMod();
    tinyassert(objectHas(mod, "default"), `no deafult export found`);
    return mod.default;
  }
  return;
}

// use own "use client" components as external
function importClientInternal(): Promise<typeof import("../client-internal")> {
  return import("@hiogawa/react-server/client-internal" as string);
}

async function renderPage(node: RouteTreeNode, props: PageProps) {
  const Page = (await importDefault(node.value?.page)) ?? ThrowNotFound;
  return <Page {...props} />;
}

async function renderLayout(
  node: RouteTreeNode,
  props: PageProps,
  name: string,
) {
  const { ErrorBoundary, RedirectBoundary, LayoutContent } =
    await importClientInternal();

  let acc = <LayoutContent name={name} />;
  acc = <RedirectBoundary>{acc}</RedirectBoundary>;

  const ErrorPage = await importDefault(node.value?.error);
  if (ErrorPage) {
    acc = <ErrorBoundary errorComponent={ErrorPage}>{acc}</ErrorBoundary>;
  }
  const Layout = await importDefault(node.value?.layout);
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
    const next = matchRouteChild(key, node);
    if (next?.child) {
      node = next.child;
      if (next.param) {
        params = { ...params, [next.param]: decodeURI(key) };
      }
    } else {
      node = initTreeNode();
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
      pages[prefix] = await renderPage(node, props);
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
