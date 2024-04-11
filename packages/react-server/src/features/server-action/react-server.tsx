import { tinyassert } from "@hiogawa/utils";
import type { BundlerConfig, ImportManifestEntry } from "../../lib/types";
import type { ReactServerErrorContext } from "../../server";

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
    bind: {
      value: () => {
        throw new Error("todo: createServerReference.bind");
      },
      configurable: true,
    },
  }) as any;
}

export type ActionResult = {
  id?: string;
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

const REFERENCE_SEP = "::";

export function createActionBundlerConfig(): BundlerConfig {
  return new Proxy(
    {},
    {
      get(_target, $$id, _receiver) {
        tinyassert(typeof $$id === "string");
        let [id, name] = $$id.split(REFERENCE_SEP);
        tinyassert(id);
        tinyassert(name);
        return { id, name, chunks: [] } satisfies ImportManifestEntry;
      },
    },
  );
}
