import BarOfProgress from "@badrap/bar-of-progress";
import React from "react";
import { Toaster } from "react-hot-toast";
import {
  NavLink,
  Outlet,
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
            >
              {href}
            </NavLink>
          </li>
        ))}
      </ul>
      <div className="flex-1"></div>
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
  "/other",
  "/dynamic/any",
  "/loader-data",
  "/server-redirect",
  "/subdir",
  "/subdir/other",
  "/error",
];

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
