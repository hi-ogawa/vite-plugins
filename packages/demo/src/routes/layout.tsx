import BarOfProgress from "@badrap/bar-of-progress";
import { tinyassert } from "@hiogawa/utils";
import {
  getExtraRouteInfo,
  resolveAssetPathsByRouteId,
} from "@hiogawa/vite-glob-routes/dist/react-router";
import React from "react";
import { Toaster } from "react-hot-toast";
import {
  type DataRouteObject,
  NavLink,
  Outlet,
  UNSAFE_DataRouterContext,
  matchRoutes,
  useLocation,
  useNavigation,
  useRouteError,
} from "react-router-dom";
import { useEffectNoStrict } from "../utils/misc-react";
import { ReactQueryWrapper } from "../utils/react-query-utils";

export const handle = "root-handle";

export function Component() {
  useTopProgressBar();

  return (
    <ReactQueryWrapper>
      <Toaster
        toastOptions={{
          className: "!bg-colorBgElevated !text-colorText",
        }}
      />
      <PageInner />
    </ReactQueryWrapper>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  const location = useLocation();

  return (
    <div className="flex flex-col items-center p-4">
      <div className="flex flex-col gap-3 w-full max-w-2xl">
        {location.pathname !== "/" && (
          <div>
            <a href="/" className="antd-btn antd-btn-default px-2 py-1">
              Back to Home
            </a>
          </div>
        )}
        {/* slightly different error internal on server/client? */}
        <pre
          suppressHydrationWarning
          className="text-sm overflow-auto border p-2 text-colorErrorText bg-colorErrorBg border-colorErrorBorder"
        >
          {error instanceof Error
            ? error.stack ?? error.message
            : JSON.stringify(error, null, 2)}
        </pre>
      </div>
    </div>
  );
}

function PageInner() {
  return (
    <div className="flex flex-col">
      <Header />
      <div className="flex flex-col items-center">
        <div className="w-full max-w-2xl">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

function Header() {
  const injectPrefetch = useInjectPagePrefetchLinks();

  return (
    <header className="top-0 sticky antd-body flex items-center p-2 px-4 gap-3 shadow-md shadow-black/[0.05] dark:shadow-black/[0.7] z-1">
      <div>Example</div>
      <ul className="flex gap-2 text-xs font-mono">
        {ROUTES.map((href) => (
          <li key={href} className="flex">
            <NavLink
              className="border antd-menu-item aria-[current=page]:antd-menu-item-active px-2 py-0.5"
              to={href}
              end
              onMouseEnter={() => injectPrefetch(href)}
            >
              {href}
            </NavLink>
          </li>
        ))}
      </ul>
      <div className="flex-1"></div>
      <span
        className="[.hydrated_&]:hidden antd-spin w-4 h-4"
        title="hydrating..."
      ></span>
      <ThemeSelect />
      <a
        className="antd-btn antd-btn-ghost i-ri-github-line w-6 h-6"
        href="https://github.com/hi-ogawa/vite-plugins"
        target="_blank"
      ></a>
    </header>
  );
}

const ROUTES = [
  "/",
  "/dynamic/any",
  "/loader-data",
  "/server-redirect",
  "/subdir",
  "/subdir/other",
  "/error",
];

//
// link prefetching
//

// cf. https://github.com/remix-run/remix/blob/9ae3cee0e81ccb7259d6103df490b019e8c2fd94/packages/remix-react/components.tsx#L479
function useInjectPagePrefetchLinks() {
  const dataRouteContext = React.useContext(UNSAFE_DataRouterContext);
  tinyassert(dataRouteContext);
  const routes = dataRouteContext.router.routes;

  function inject(page: string) {
    const hrefs = resolveAssetPathsByPage(routes, page);
    for (const href of hrefs) {
      // TODO: escape
      const found = document.body.querySelector(`link[href="${href}"]`);
      if (!found) {
        const el = document.createElement("link");
        el.setAttribute("rel", "modulepreload");
        el.setAttribute("href", href);
        document.body.appendChild(el);
      }
    }
  }

  return inject;
}

function resolveAssetPathsByPage(
  routes: DataRouteObject[],
  page: string
): string[] {
  const matches = matchRoutes(routes, page) ?? [];
  const extraRouterInfo = getExtraRouteInfo();
  const assetPaths = matches.flatMap((m) =>
    resolveAssetPathsByRouteId(m.route.id, extraRouterInfo)
  );
  return assetPaths;
}

//
// ThemeSelect
//

declare let __themeSet: (theme: string) => void;
declare let __themeGet: () => string;

export function ThemeSelect() {
  return (
    <button
      className="flex items-center antd-btn antd-btn-ghost"
      onClick={() => {
        __themeSet(__themeGet() === "dark" ? "light" : "dark");
      }}
    >
      <span className="dark:i-ri-sun-line light:i-ri-moon-line !w-5 !h-5"></span>
    </button>
  );
}

//
// navigation progress bar
//

function useTopProgressBar() {
  const navigation = useNavigation();
  const loading = navigation.state !== "idle";
  const [progress] = React.useState(() => new BarOfProgress({ size: 3 }));

  useEffectNoStrict(() => {
    if (loading) {
      progress.start();
    } else {
      progress.finish();
    }
  }, [loading]);
}
