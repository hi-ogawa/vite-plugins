import { ErrorBoundary } from "@hiogawa/react-server/client";
import type { LayoutRouteProps } from "@hiogawa/react-server/server";
import { NavMenu } from "../../components/nav-menu";
import { Hydrated } from "./_client";
import ErrorPage from "./error";

export default async function Layout(props: LayoutRouteProps) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-lg">Test</h2>
      <NavMenu
        className="grid grid-cols-2 w-xs gap-1"
        links={[
          "/test",
          "/test/other",
          "/test/action",
          "/test/deps",
          "/test/head",
          "/test/css",
          "/test/error",
          "/test/not-found",
        ]}
      />
      <div className="flex items-center gap-2 w-sm text-sm">
        <input className="antd-input px-2" placeholder="test-input" />
        <Hydrated />
      </div>
      {/* TODO: implement as convention */}
      <ErrorBoundary errorComponent={ErrorPage} url={props.request.url}>
        {props.children}
      </ErrorBoundary>
    </div>
  );
}
