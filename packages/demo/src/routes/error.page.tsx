import React from "react";
import { useNavigate, useRouteError } from "react-router-dom";

export function Component() {
  const [error, setError] = React.useState<Error>();

  if (error) {
    throw error;
  }

  return (
    <div className="flex flex-col items-center">
      <div className="w-full p-6">
        <div className="flex flex-col gap-2">
          <h1>Page Component</h1>
          <button
            className="antd-btn antd-btn-default"
            onClick={() => {
              setError(new Error("hey render eror!"));
            }}
          >
            Throw
          </button>
        </div>
      </div>
    </div>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center">
      <div className="w-full p-6">
        <div className="flex flex-col gap-2">
          <h1>ErrorBoundary Component</h1>
          <button
            className="antd-btn antd-btn-default"
            onClick={() => {
              // trick to reset error
              // https://github.com/remix-run/react-router/blob/bc2552840147206716544e5cdcdb54f649f9193f/packages/react-router/lib/hooks.tsx#L575-L583
              navigate("", { replace: true });
            }}
          >
            Reset
          </button>
          <pre className="text-sm overflow-auto border p-2 text-colorErrorText bg-colorErrorBg border-colorErrorBorder">
            {error instanceof Error
              ? error.stack ?? error.message
              : JSON.stringify(error, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
