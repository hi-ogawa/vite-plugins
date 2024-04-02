import { tinyassert } from "@hiogawa/utils";

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

// Builtin action context system based on FormData identity.
// Users can easilty setup own AsyncLocalStorage based request context using custom handler,
// but we don't make it as an builtin feature until async hooks are properly supported on Stackblitz.
export const actionContextMap = new WeakMap<FormData, ActionContext>();

export interface ActionContext {
  request: Request;
  responseHeaders: Headers;
}

export function getActionContext(formData: FormData) {
  const ctx = actionContextMap.get(formData);
  tinyassert(ctx);
  return ctx;
}
