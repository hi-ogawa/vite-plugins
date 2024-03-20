import type { LayoutRouteProps } from "@hiogawa/react-server/server";
import { ErrorBoundary } from "./_client";
import ErrorPage from "./error";

export default function Layout(props: LayoutRouteProps) {
  return (
    <div className="flex flex-col items-start gap-2">
      <h3>[Layout]</h3>
      {/* TODO: need two-pass render to catch SSR error? (cf. packages/vite-glob-routes/examples/demo/src/server/ssr.tsx) */}
      <ErrorBoundary errorComponent={ErrorPage}>
        <div>{props.children}</div>
      </ErrorBoundary>
    </div>
  );
}
