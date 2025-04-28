"use client";

import * as React from "react";

interface Props {
  children?: React.ReactNode;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return <div>Caught an error: {this.state.error.message}</div>;
    }
    return this.props.children;
  }
}
