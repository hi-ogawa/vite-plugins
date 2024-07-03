import { sortBy } from "@hiogawa/utils";
import React from "react";
import { type ReactServerErrorContext, createError } from "../error/shared";
import { renderMetadata } from "../meta/server";
import type { Metadata } from "../meta/utils";
import type { ApiRouteMoudle } from "./api-route";
import {
  type MatchNodeEntry,
  type TreeNode,
  createFsRouteTree,
  matchRouteTree,
  parseRoutePath,
  toMatchParamsObject,
} from "./tree";

// cf. https://nextjs.org/docs/app/building-your-application/routing#file-conventions
export interface RouteModule {
  page?: () => Promise<{
    default: React.FC<PageProps>;
    metadata?: Metadata;
    generateStaticParams?: () => Promise<Record<string, string>[]>;
  }>;
  layout?: () => Promise<{
    default: React.FC<LayoutProps>;
    metadata?: Metadata;
  }>;
  error?: () => Promise<{
    // TODO: warn if no "use client"
    default: React.FC<ErrorPageProps>;
  }>;
  "not-found"?: () => Promise<{
    default: React.FC;
  }>;
  loading?: () => Promise<{
    default: React.FC;
  }>;
  template?: () => Promise<{
    default: React.FC<{ children?: React.ReactNode }>;
  }>;
  route?: () => Promise<ApiRouteMoudle>;
}

export type RouteModuleKey = keyof RouteModule;

export type RouteModuleTree = TreeNode<RouteModule>;

export function generateRouteModuleTree(globEntries: Record<string, any>) {
  const { tree, entries } = createFsRouteTree<RouteModule>(globEntries);
  const manifest = getRouteModuleManifest(entries);
  return { tree, manifest };
}

// use own "use client" components as external
function importRuntimeClient(): Promise<typeof import("../../runtime/client")> {
  return import("@hiogawa/react-server/runtime/client" as string);
}

async function renderPage(node: RouteModuleTree, props: PageProps) {
  const Page = (await importLazy(node, "page")) ?? ThrowNotFound;
  return <Page {...props} />;
}

async function renderLayout(
  node: RouteModuleTree,
  props: PageProps,
  { prefix, params }: MatchNodeEntry<RouteModule>,
) {
  const {
    ErrorBoundary,
    RedirectBoundary,
    NotFoundBoundary,
    RemountRoute,
    LayoutContent,
    LayoutMatchProvider,
  } = await importRuntimeClient();

  let acc = <LayoutContent name={prefix} />;
  acc = <RedirectBoundary>{acc}</RedirectBoundary>;

  const NotFoundPage = await importLazy(node, "not-found");
  if (NotFoundPage) {
    acc = (
      <NotFoundBoundary fallback={<NotFoundPage />}>{acc}</NotFoundBoundary>
    );
  }

  const ErrorPage = await importLazy(node, "error");
  if (ErrorPage) {
    acc = <ErrorBoundary errorComponent={ErrorPage}>{acc}</ErrorBoundary>;
  }

  const LoadingPage = await importLazy(node, "loading");
  if (LoadingPage) {
    acc = (
      <RemountRoute>
        <React.Suspense fallback={<LoadingPage />}>{acc}</React.Suspense>
      </RemountRoute>
    );
  }

  const TemplatePage = await importLazy(node, "template");
  if (TemplatePage) {
    acc = (
      <RemountRoute>
        <TemplatePage>{acc}</TemplatePage>
      </RemountRoute>
    );
  }

  const Layout = await importLazy(node, "layout");
  if (Layout) {
    acc = (
      <Layout key={prefix} {...props}>
        {acc}
      </Layout>
    );
  } else {
    acc = <React.Fragment key={prefix}>{acc}</React.Fragment>;
  }

  acc = <LayoutMatchProvider value={{ params }}>{acc}</LayoutMatchProvider>;
  return acc;
}

export async function renderRouteMap(
  tree: RouteModuleTree,
  request: Pick<Request, "url" | "headers">,
) {
  const url = new URL(request.url);
  const baseProps: Omit<BaseProps, "params"> = {
    url: serializeUrl(url),
    request: {
      url: request.url,
      headers: serializeHeaders(request.headers),
    },
    searchParams: Object.fromEntries(url.searchParams),
  };
  const pages: Record<string, React.ReactNode> = {};
  const layouts: Record<string, React.ReactNode> = {};
  const metadata: Metadata = {};
  const result = matchRouteTree(tree, url.pathname);
  for (const m of result.matches) {
    const props: BaseProps = {
      ...baseProps,
      params: toMatchParamsObject(m.params),
    };
    if (m.type === "layout") {
      layouts[m.prefix] = await renderLayout(m.node, props, m);
      Object.assign(metadata, await importLazy(m.node, "layout", "metadata"));
    } else if (m.type === "page") {
      pages[m.prefix] = await renderPage(m.node, props);
      Object.assign(metadata, await importLazy(m.node, "page", "metadata"));
    } else {
      m.type satisfies never;
    }
  }
  return {
    pages,
    layouts,
    metadata: renderMetadata(metadata),
    params: result.params,
  };
}

// TODO
// support SSR-ing not-found
// requires passing status without throwing
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
  searchParams: Record<string, string>;
}

export interface PageProps extends BaseProps {}

export interface LayoutProps extends React.PropsWithChildren<BaseProps> {}

export interface ErrorPageProps {
  error: Error;
  serverError?: ReactServerErrorContext;
  reset: () => void;
}

type RouteModuleEntry = {
  pathname: string;
  module?: RouteModule;
  dynamic: boolean;
  format: (params: Record<string, string>) => string;
};

export type RouteModuleManifest = {
  entries: RouteModuleEntry[];
};

export function getRouteModuleManifest(
  entries: Record<string, RouteModule>,
): RouteModuleManifest {
  const result: RouteModuleManifest = { entries: [] };
  for (const [pathname, module] of Object.entries(entries)) {
    const { dynamic, format } = parseRoutePath(pathname);
    result.entries.push({
      pathname,
      module,
      dynamic,
      format,
    });
  }
  result.entries = sortBy(result.entries, (e) => e.pathname);
  return result;
}

export async function importLazy(
  node: RouteModuleTree,
  file: RouteModuleKey,
  exportName = "default",
): Promise<any> {
  const lazy = node.value?.[file];
  if (lazy) {
    const mod = (await lazy()) as any;
    return mod[exportName];
  }
  return;
}
