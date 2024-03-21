"use client";

import { __global } from "@hiogawa/react-server/internal";
import React from "react";

// TOOD: for now, experiment inside demo

// cf.
// https://github.com/vercel/next.js/blob/33f8428f7066bf8b2ec61f025427ceb2a54c4bdf/packages/next/src/client/components/error-boundary.tsx
// https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
export class ErrorBoundary extends React.Component<
  {
    children?: React.ReactNode;
    errorComponent: React.FC<any>;
  },
  { error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  reset = () => {
    this.setState({ error: null });
  };

  override render() {
    // SSR context to pick up error from 1st pass in 2nd pass?
    // __global.ssrContext[props.ssrId]
    // TODO: how to know where the error is from?
    //       track SSR of all error boundaries and whether?
    const error = import.meta.env.SSR ? __global.ssrError : this.state.error;
    console.log("[ErrorBoundary.render]", { error });
    if (error) {
      const Component = this.props.errorComponent;
      return <Component error={error} reset={this.reset} />;
    }
    return this.props.children;
  }
}
