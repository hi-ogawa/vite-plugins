import type { ReactServerErrorContext } from "../../server";

// https://github.com/facebook/react/blob/89021fb4ec9aa82194b0788566e736a4cedfc0e4/packages/react-server-dom-webpack/src/ReactFlightWebpackReferences.js#L87

export function createServerReference(id: string, action: Function): React.FC {
  return Object.defineProperties(action, {
    $$typeof: {
      value: Symbol.for("react.server.reference"),
    },
    $$id: {
      value: id,
      configurable: true,
    },
    $$bound: { value: null, configurable: true },
    // [TODO]
    bind: {
      value: () => {
        throw new Error("todo: createServerReference.bind");
      },
      configurable: true,
    },
  }) as any;
}

export type ActionResult = {
  id: string;
  error?: ReactServerErrorContext;
  data?: unknown;
  responseHeaders?: Record<string, string>;
  context: ActionContext;
};

export class ActionContext {
  responseHeaders: Record<string, string> = {};

  // TODO: refine revalidation by layout key
  revalidate = false;

  constructor(public request: Request) {}
}
