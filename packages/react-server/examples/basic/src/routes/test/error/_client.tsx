"use client";

import React from "react";

// TOOD: for now, experiment in demo

// cf. https://github.com/vercel/next.js/blob/33f8428f7066bf8b2ec61f025427ceb2a54c4bdf/packages/next/src/client/components/error-boundary.tsx
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
    if (this.state.error) {
      const Component = this.props.errorComponent;
      return <Component error={this.state.error} reset={this.reset} />;
    }
    return this.props.children;
  }
}
