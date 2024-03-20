"use client";

import React from "react";

// cf. https://github.com/vercel/next.js/blob/33f8428f7066bf8b2ec61f025427ceb2a54c4bdf/packages/next/src/client/components/error-boundary.tsx
export class ErrorBoundary extends React.Component<
  {
    children?: React.ReactNode;
    errorComponent: React.FC<{ error?: Error }>;
  },
  { error?: Error }
> {
  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  override render() {
    if (this.state.error) {
      const Component = this.props.errorComponent;
      return <Component error={this.state.error} />;
    }
    return this.props.children;
  }
}
