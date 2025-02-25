import { tinyassert } from "@hiogawa/utils";
import React from "react";
import { useRouter } from "../router/client/router";
import type { ErrorPageProps } from "../router/server";
import { getErrorContext, isNotFoundError, isRedirectError } from "./shared";

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

  static getDerivedStateFromError(error: Error): {
    error: Error;
  } {
    const ctx = getErrorContext(error);
    if (ctx && (isNotFoundError(ctx) || isRedirectError(ctx))) {
      throw error;
    }
    return { error };
  }

  reset = (): void => {
    React.startTransition(() => {
      this.setState({ error: null });
    });
  };

  override render():
    | string
    | number
    | bigint
    | boolean
    | Iterable<React.ReactNode>
    | Promise<
        | string
        | number
        | bigint
        | boolean
        | React.ReactPortal
        | React.ReactElement<unknown, string | React.JSXElementConstructor<any>>
        | Iterable<React.ReactNode>
        | null
        | undefined
      >
    | import("react/jsx-runtime").JSX.Element
    | null
    | undefined {
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

export class RedirectBoundary extends React.Component<React.PropsWithChildren> {
  override state: { error: null } | { error: Error; redirectLocation: string } =
    { error: null };

  static getDerivedStateFromError(error: Error): {
    error: Error;
    redirectLocation: string;
  } {
    const ctx = getErrorContext(error);
    const redirect = ctx && isRedirectError(ctx);
    if (redirect) {
      return {
        error,
        redirectLocation: redirect.location,
      } satisfies RedirectBoundary["state"];
    }
    throw error;
  }

  override render():
    | string
    | number
    | bigint
    | boolean
    | Iterable<React.ReactNode>
    | Promise<
        | string
        | number
        | bigint
        | boolean
        | React.ReactPortal
        | React.ReactElement<unknown, string | React.JSXElementConstructor<any>>
        | Iterable<React.ReactNode>
        | null
        | undefined
      >
    | import("react/jsx-runtime").JSX.Element
    | null
    | undefined {
    if (this.state.error) {
      return (
        <RedirectHandler
          suspensionKey={this.state.error}
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
}): null {
  tinyassert(!import.meta.env.SSR);

  // trigger browser full-reload for simplicity until we figure out the mystery of react transition.
  // note that, in practice, such server component redirection is (hopefullly) fairly unlikely
  // since it means that app has a client navigation Link which redirects to somewhere else.
  let suspension = redirectSuspensionMap.get(props.suspensionKey);
  if (!suspension) {
    suspension = new Promise(() => {});
    redirectSuspensionMap.set(props.suspensionKey, suspension);
    window.location.href = props.redirectLocation;
  }
  return React.use(suspension);
}

export class NotFoundBoundary extends React.Component<{
  fallback: React.ReactNode;
  children?: React.ReactNode;
}> {
  override state: { error?: Error } = {};

  static getDerivedStateFromError(error: Error): {
    error: Error;
  } {
    const ctx = getErrorContext(error);
    if (ctx && isNotFoundError(ctx)) {
      return { error };
    }
    throw error;
  }

  override render(): React.ReactNode {
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
