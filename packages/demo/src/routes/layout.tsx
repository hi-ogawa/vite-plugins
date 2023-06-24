import { NavLink, Outlet } from "react-router-dom";
import { ReactQueryWrapper } from "../utils/react-query-utils";

export function Page() {
  return (
    <ReactQueryWrapper>
      <PageInner />
    </ReactQueryWrapper>
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
    <header className="flex items-center p-2 px-4 gap-4 shadow-md shadow-black/[0.05] dark:shadow-black/[0.7] z-1">
      <div>Example</div>
      <ul className="flex gap-2 text-sm font-mono">
        {ROUTES.map((href) => (
          <li key={href} className="flex">
            <NavLink
              className="border antd-menu-item aria-[current=page]:antd-menu-item-active px-2"
              to={href}
              end
            >
              {href}
            </NavLink>
          </li>
        ))}
      </ul>
      <div className="flex-1"></div>
      <a
        className="antd-btn antd-btn-ghost i-ri-github-line w-6 h-6"
        href="https://github.com/hi-ogawa/vite-plugins"
        target="_blank"
      ></a>
    </header>
  );
}

const ROUTES = ["/", "/other", "/some-dynamic-id", "/subdir", "/subdir/other"];
