"use client";

import { getErrorStatus } from "@hiogawa/react-server";
import { type ErrorRouteProps } from "@hiogawa/react-server/server";
import React from "react";

// TOOD: for now, experiment inside demo

interface Props {
  children?: React.ReactNode;
  errorComponent: React.FC<ErrorRouteProps>;
  url: string;
}

interface State {
  error: Error | null;
  url: string;
}

// cf.
// https://github.com/vercel/next.js/blob/33f8428f7066bf8b2ec61f025427ceb2a54c4bdf/packages/next/src/client/components/error-boundary.tsx
// https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
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
    state = { ...state };
    if (props.url !== state.url) {
      state.error = null;
    }
    return { ...state, url: props.url };
  }

  reset = () => {
    this.setState({ error: null });
  };

  override render() {
    if (this.state.error) {
      const Component = this.props.errorComponent;
      return (
        <Component
          error={this.state.error}
          status={getErrorStatus(this.state.error) ?? 500}
          reset={this.reset}
        />
      );
    }
    // TODO: need to be wrapped with dom?
    return <div>{this.props.children}</div>;
  }
}
