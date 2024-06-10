import { objectHas, tinyassert } from "@hiogawa/utils";
import React from "react";
import { type ReactServerErrorContext, createError } from "../../lib/error";
import { type TreeNode, createFsRouteTree, matchRouteTree } from "./tree";

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

type RouteModuleNode = TreeNode<RouteEntry>;

export function generateRouteModuleTree(globEntries: Record<string, unknown>) {
  return createFsRouteTree(globEntries) as RouteModuleNode;
}

// use own "use client" components as external
function importRuntimeClient(): Promise<typeof import("../../runtime-client")> {
  return import("@hiogawa/react-server/runtime-client" as string);
}

async function renderPage(node: RouteModuleNode, props: PageProps) {
  const Page = (await importDefault(node.value?.page)) ?? ThrowNotFound;
  return <Page {...props} />;
}

async function renderLayout(
  node: RouteModuleNode,
  props: PageProps,
  prefix: string,
) {
  const { ErrorBoundary, RedirectBoundary, LayoutContent } =
    await importRuntimeClient();

  let acc = <LayoutContent name={prefix} />;
  acc = <RedirectBoundary>{acc}</RedirectBoundary>;

  const ErrorPage = await importDefault(node.value?.error);
  if (ErrorPage) {
    acc = <ErrorBoundary errorComponent={ErrorPage}>{acc}</ErrorBoundary>;
  }
  const Layout = await importDefault(node.value?.layout);
  if (Layout) {
    acc = (
      <Layout key={prefix} {...props}>
        {acc}
      </Layout>
    );
  } else {
    acc = <React.Fragment key={prefix}>{acc}</React.Fragment>;
  }
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
  const result = matchRouteTree(tree, url.pathname);
  for (const m of result.matches) {
    const props: BaseProps = { ...baseProps, params: m.params };
    if (m.type === "layout") {
      layouts[m.prefix] = await renderLayout(m.node, props, m.prefix);
    } else if (m.type === "page") {
      pages[m.prefix] = renderPage(m.node, props);
    } else {
      m.type satisfies never;
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
