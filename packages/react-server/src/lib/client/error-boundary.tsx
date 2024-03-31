import React from "react";
import { getErrorContext, getStatusText } from "../error";
import type { ErrorPageProps } from "../router";
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

// TODO: not working
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

function DefaultRootErrorPage(props: ErrorPageProps) {
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
