import { tinyassert } from "@hiogawa/utils";
import React from "react";
import type { ErrorPageProps } from "../../features/router/server";
import { getErrorContext, getStatusText, isRedirectError } from "../error";
import { useRouter } from "./router";

// cf.
// https://github.com/vercel/next.js/blob/33f8428f7066bf8b2ec61f025427ceb2a54c4bdf/packages/next/src/client/components/error-boundary.tsx
// https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary

interface Props {
  children?: React.ReactNode;
  errorComponent: React.FC<ErrorPageProps>;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  reset = () => {
    React.startTransition(() => {
      this.setState({ error: null });
    });
  };

  override render() {
    const error = this.state.error;
    if (error) {
      return (
        <>
          <this.props.errorComponent
            error={error}
            serverError={getErrorContext(error)}
            reset={this.reset}
          />
          <ErrorAutoReset reset={this.reset} />
        </>
      );
    }
    return this.props.children;
  }
}

function ErrorAutoReset(props: Pick<ErrorPageProps, "reset">) {
  const href = useRouter((s) => s.location.href);
  const initialHref = React.useRef(href).current;
  React.useEffect(() => {
    if (href !== initialHref) {
      props.reset();
    }
  }, [href]);
  return null;
}

export function RootErrorBoundary(props: React.PropsWithChildren) {
  return <ErrorBoundary errorComponent={DefaultRootErrorPage} {...props} />;
}

// TODO: customizable
function DefaultRootErrorPage(props: ErrorPageProps) {
  const status = props.serverError?.status;
  const message = status
    ? `${status} ${getStatusText(status)}`
    : "Unknown Error";
  return (
    <html>
      <title>{message}</title>
      <body>
        <h1>{message}</h1>
        <div>
          Back to <a href="/">Home</a>
        </div>
      </body>
    </html>
  );
}

export class RedirectBoundary extends React.Component<React.PropsWithChildren> {
  override state: { redirectLocation?: string } = {};

  static getDerivedStateFromError(error: Error) {
    if (!import.meta.env.SSR) {
      const ctx = getErrorContext(error);
      const redirect = ctx && isRedirectError(ctx);
      if (redirect) {
        return { redirectLocation: redirect.location };
      }
    }
    throw error;
  }

  override render() {
    if (this.state.redirectLocation) {
      return (
        <RedirectHandler
          suspensionKey={this.state}
          redirectLocation={this.state.redirectLocation}
        />
      );
    }
    return this.props.children;
  }
}

// trigger client navigation once and suspend forever
const redirectSuspensionMap = new WeakMap<object, Promise<null>>();

export function RedirectHandler(props: {
  suspensionKey: object;
  redirectLocation: string;
}) {
  tinyassert(!import.meta.env.SSR);

  // trigger client navigation once and suspend until router fixes this up
  const history = useRouter((s) => s.history);
  let suspension = redirectSuspensionMap.get(props.suspensionKey);
  if (!suspension) {
    suspension = new Promise(() => {});
    redirectSuspensionMap.set(props.suspensionKey, suspension);
    setTimeout(() => history.replace(props.redirectLocation));
  }
  return React.use(suspension);
}

export class NotFoundBoundary extends React.Component<{
  fallback: React.ReactNode;
  children?: React.ReactNode;
}> {
  override state: { error?: Error } = {};

  static getDerivedStateFromError(error: Error) {
    if (getErrorContext(error)?.status === 404) {
      return { error };
    }
    throw error;
  }

  override render() {
    if (this.state.error) {
      return (
        <>
          {this.props.fallback}
          <ErrorAutoReset
            reset={() => {
              React.startTransition(() => {
                this.setState({ error: null });
              });
            }}
          />
        </>
      );
    }
    return this.props.children;
  }
}
