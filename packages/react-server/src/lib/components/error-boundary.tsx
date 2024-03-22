"use client";

import React from "react";
import { getErrorContext, getStatusText } from "../error";
import type { ErrorRouteProps } from "../router";

// cf.
// https://github.com/vercel/next.js/blob/33f8428f7066bf8b2ec61f025427ceb2a54c4bdf/packages/next/src/client/components/error-boundary.tsx
// https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary

interface Props {
  children?: React.ReactNode;
  errorComponent: React.FC<ErrorRouteProps>;
  url: string;
}

interface State {
  error: Error | null;
  url: string;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null, url: props.url };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  // automatically reset on url change
  static getDerivedStateFromProps(props: Props, state: State): State {
    return {
      ...state,
      url: props.url,
      error: props.url === state.url ? state.error : null,
    };
  }

  reset = () => {
    this.setState({ error: null });
  };

  override render() {
    const error = this.state.error;
    if (error) {
      const Component = this.props.errorComponent;
      return (
        <Component
          error={error}
          serverError={getErrorContext(error)}
          reset={this.reset}
        />
      );
    }
    return this.props.children;
  }
}

export function DefaultRootErrorPage(props: ErrorRouteProps) {
  const status = props.serverError?.status;
  return (
    <html>
      <body>
        {status ? (
          <div>
            {status} {getStatusText(status)}
          </div>
        ) : (
          <div>Unexpected Error</div>
        )}
      </body>
    </html>
  );
}
