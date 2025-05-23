import { getTheme, setTheme } from "@hiogawa/theme-script";
import { useTinyProgress } from "@hiogawa/tiny-progress/dist/react";
import React from "react";
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigation,
  useRouteError,
} from "react-router-dom";
import { ReactQueryWrapper } from "../utils/react-query-utils";
import { toast } from "../utils/toast";

export const handle = "root-handle";

export function Component() {
  React.useEffect(() => toast.render(), []);
  useTinyProgress({ show: useNavigation().state !== "idle" });

  return (
    <ReactQueryWrapper>
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
            ? (error.stack ?? error.message)
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
              data-preload
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
  "/session",
];

//
// ThemeSelect
//

export function ThemeSelect() {
  return (
    <button
      className="flex items-center antd-btn antd-btn-ghost"
      onClick={() => {
        setTheme(getTheme() === "dark" ? "light" : "dark");
      }}
    >
      <span className="dark:i-ri-sun-line light:i-ri-moon-line !w-5 !h-5"></span>
    </button>
  );
}
