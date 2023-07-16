import React from "react";
import {
  Link,
  useLoaderData,
  useNavigate,
  useRouteError,
  useSearchParams,
} from "react-router-dom";

export function Component() {
  const loaderData = useLoaderData();
  const [searchParams] = useSearchParams();

  // TODO: ErrorBoundary doesn't catch it during SSR?
  if (searchParams.get("id") === "exception-render") {
    throw new Error("render boom!");
  }

  return (
    <div className="flex flex-col items-center">
      <div className="w-full p-6">
        <div className="flex flex-col gap-4">
          <h1>Loader error test</h1>
          <div className="flex gap-2">
            <Link className="antd-btn antd-btn-default px-2" to="/error?id=ok">
              ok
            </Link>
            <Link
              className="antd-btn antd-btn-default px-2"
              to="/error?id=error-response"
            >
              error response
            </Link>
            <Link
              className="antd-btn antd-btn-default px-2"
              to="/error?id=exception-loader"
            >
              exception (loader)
            </Link>
            <Link
              className="antd-btn antd-btn-default px-2"
              to="/error?id=exception-render"
            >
              exception (render)
            </Link>
          </div>
          <pre className="border p-2 text-sm">
            loaderData = {JSON.stringify(loaderData, null, 2)}
          </pre>
          <React.Suspense fallback={<div>boom caught</div>}>
            {searchParams.get("id") === "exception-render" && <Boom />}
          </React.Suspense>
          <SimpleErrorBoundary>
            {searchParams.get("id") === "exception-render" && <Boom />}
          </SimpleErrorBoundary>
        </div>
      </div>
    </div>
  );
}

class SimpleErrorBoundary extends React.Component {
  constructor(props: {}) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: unknown) {
    return { error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("SimpleErrorBoundary/componentDidCatch", error, errorInfo);
  }

  override render(): React.ReactNode {
    // @ts-ignore
    if (this.state.error) {
      return <div>SimpleErrorBoundary/fallback</div>;
    }

    // @ts-ignore
    return this.props.children;
  }
}

function Boom() {
  if (true as boolean) {
    throw new Error("render boom!");
  }
  return null;
}

export function ErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center">
      <div className="w-full p-6">
        <div className="flex flex-col gap-2">
          <h1>Loader error test (ErrorBoundary)</h1>
          <button
            className="antd-btn antd-btn-default"
            onClick={() => {
              navigate("/error", { replace: true });
            }}
          >
            Reset
          </button>
          <pre
            suppressHydrationWarning
            className="text-sm overflow-auto border p-2 text-colorErrorText bg-colorErrorBg border-colorErrorBorder"
          >
            {error instanceof Error
              ? error.message
              : JSON.stringify(error, null, 2)}
          </pre>
          {error instanceof Error && (
            <div className="flex flex-col gap-2 text-sm">
              <pre>error.stack</pre>
              <pre
                suppressHydrationWarning
                className="text-sm overflow-auto border p-2 text-colorErrorText bg-colorErrorBg border-colorErrorBorder"
              >
                {/* cf. https://github.com/remix-run/react-router/blob/4e12473040de76abf26e1374c23a19d29d78efc0/packages/react-router-dom/index.tsx#L282-L284 */}
                {error.stack || "(reducted by react-router hydration?)"}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
