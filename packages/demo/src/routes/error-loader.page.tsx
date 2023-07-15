import React from "react";
import {
  Link,
  useLoaderData,
  useNavigate,
  useRouteError,
} from "react-router-dom";

export function Component() {
  const loaderData = useLoaderData();

  return (
    <div className="flex flex-col items-center">
      <div className="w-full p-6">
        <div className="flex flex-col gap-4">
          <h1>Loader error test</h1>
          <div className="flex gap-2">
            <Link
              className="antd-btn antd-btn-default px-2"
              to="/error-loader?id=ok"
            >
              ok
            </Link>
            <Link
              className="antd-btn antd-btn-default px-2"
              to="/error-loader?id=error-response"
            >
              error response
            </Link>
            <Link
              className="antd-btn antd-btn-default px-2"
              to="/error-loader?id=exception"
            >
              exception
            </Link>
          </div>
          <pre className="border p-2 text-sm">
            loaderData = {JSON.stringify(loaderData, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}

export function ErrorBoundary() {
  const error = useRouteError(); // TODO: exception becomes empty on hydration?
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center">
      <div className="w-full p-6">
        <div className="flex flex-col gap-2">
          <h1>Loader error test (ErrorBoundary)</h1>
          <button
            className="antd-btn antd-btn-default"
            onClick={() => {
              navigate("/error-loader", { replace: true });
            }}
          >
            Reset
          </button>
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
    </div>
  );
}
