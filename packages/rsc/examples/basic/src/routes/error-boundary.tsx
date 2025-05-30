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
      return (
        <div>
          ErrorBoundary caught '{this.state.error.message}'
          <button
            onClick={() => {
              this.setState({ error: null });
            }}
          >
            Reset Error
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
