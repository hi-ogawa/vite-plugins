import React from "react";
import {
  type TreeNode,
  createFsRouteTree,
  initTreeNode,
  matchRouteChild,
} from "../features/router/tree";
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

type RouteModuleNode = TreeNode<RouteEntry>;

export function generateRouteModuleTree(globEntries: Record<string, unknown>) {
  return createFsRouteTree(globEntries) as RouteModuleNode;
}

// use own "use client" components as external
function importRuntimeClient(): Promise<typeof import("../runtime-client")> {
  return import("@hiogawa/react-server/runtime-client" as string);
}

function renderPage(node: RouteModuleNode, props: PageProps) {
  const Page = node.value?.page?.default ?? ThrowNotFound;
  return <Page {...props} />;
}

async function renderLayout(
  node: RouteModuleNode,
  props: PageProps,
  name: string,
  key?: string,
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
    acc = (
      <Layout key={key} {...props}>
        {acc}
      </Layout>
    );
  } else {
    acc = <React.Fragment key={key}>{acc}</React.Fragment>;
  }
  return acc;
}

// TODO: implement on top of matchRouteTree
export async function renderRouteMap(
  tree: RouteModuleNode,
  request: Pick<Request, "url" | "headers">,
) {
  const url = serializeUrl(new URL(request.url));
  const pathname = normalizePathname(url.pathname);
  const prefixes = getPathPrefixes(pathname);
  const baseProps: Omit<BaseProps, "params"> = {
    url,
    request: {
      url: request.url,
      headers: serializeHeaders(request.headers),
    },
  };

  let node = tree;
  let params: BaseProps["params"] = {};
  const pages: Record<string, React.ReactNode> = {};
  const layouts: Record<string, React.ReactNode> = {};
  for (let i = 0; i < prefixes.length; i++) {
    const prefix = prefixes[i]!;
    const key = prefix.split("/").at(-1)!;
    const next = matchRouteChild(key, node);
    if (next?.child) {
      node = next.child;
      if (next?.catchAll) {
        const rest = pathname.slice(prefixes[i - 1]!.length + 1);
        params = { ...params, [next.param]: decodeURI(rest) };
        const props: BaseProps = { ...baseProps, params };
        layouts[prefix] = await renderLayout(node, props, prefix);
        for (const prefix of prefixes.slice(i)) {
          layouts[prefix] = await renderLayout(initTreeNode(), props, prefix);
        }
        pages[pathname] = renderPage(node, props);
        break;
      } else if (next.param) {
        params = { ...params, [next.param]: decodeURI(key) };
      }
    } else {
      node = initTreeNode();
    }
    const props: BaseProps = { ...baseProps, params };
    // re-mount subtree when dynamic segment changes
    const cacheKey = [i, next?.param ?? "", key].join("");
    layouts[prefix] = await renderLayout(node, props, prefix, cacheKey);
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
