import React from "react";
import { type ReactServerErrorContext, createError } from "../../lib/error";
import { renderMetadata } from "../meta/server";
import type { Metadata } from "../meta/utils";
import {
  type MatchNodeEntry,
  type TreeNode,
  createFsRouteTree,
  matchRouteTree,
  toMatchParamsObject,
} from "./tree";

// cf. https://nextjs.org/docs/app/building-your-application/routing#file-conventions
interface RouteEntry {
  page?: {
    metadata?: Metadata;
    default: React.FC<PageProps>;
  };
  layout?: {
    metadata?: Metadata;
    default: React.FC<LayoutProps>;
  };
  error?: {
    // TODO: warn if no "use client"
    default: React.FC<ErrorPageProps>;
  };
  "not-found"?: {
    default: React.FC;
  };
}

type RouteModuleNode = TreeNode<RouteEntry>;

export function generateRouteModuleTree(globEntries: Record<string, unknown>) {
  return createFsRouteTree(globEntries) as RouteModuleNode;
}

// use own "use client" components as external
function importRuntimeClient(): Promise<typeof import("../../runtime-client")> {
  return import("@hiogawa/react-server/runtime-client" as string);
}

function renderPage(node: RouteModuleNode, props: PageProps) {
  const Page = node.value?.page?.default ?? ThrowNotFound;
  return <Page {...props} />;
}

async function renderLayout(
  node: RouteModuleNode,
  props: PageProps,
  { prefix, params }: MatchNodeEntry<RouteEntry>,
) {
  const {
    ErrorBoundary,
    RedirectBoundary,
    NotFoundBoundary,
    LayoutContent,
    LayoutMatchProvider,
  } = await importRuntimeClient();

  let acc = <LayoutContent name={prefix} />;
  acc = <RedirectBoundary>{acc}</RedirectBoundary>;

  const NotFoundPage = node.value?.["not-found"]?.default;
  if (NotFoundPage) {
    acc = (
      <NotFoundBoundary fallback={<NotFoundPage />}>{acc}</NotFoundBoundary>
    );
  }
  const ErrorPage = node.value?.error?.default;
  if (ErrorPage) {
    acc = <ErrorBoundary errorComponent={ErrorPage}>{acc}</ErrorBoundary>;
  }
  const Layout = node.value?.layout?.default;
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
  tree: RouteModuleNode,
  request: Pick<Request, "url" | "headers">,
) {
  const url = serializeUrl(new URL(request.url));
  const baseProps: Omit<BaseProps, "params"> = {
    url,
    request: {
      url: request.url,
      headers: serializeHeaders(request.headers),
    },
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
      Object.assign(metadata, m.node.value?.layout?.metadata);
    } else if (m.type === "page") {
      pages[m.prefix] = renderPage(m.node, props);
      Object.assign(metadata, m.node.value?.page?.metadata);
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
}

export interface PageProps extends BaseProps {}

export interface LayoutProps extends React.PropsWithChildren<BaseProps> {}

export interface ErrorPageProps {
  error: Error;
  serverError?: ReactServerErrorContext;
  reset: () => void;
}
