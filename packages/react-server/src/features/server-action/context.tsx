import { tinyassert } from "@hiogawa/utils";
import type { ActionContext } from "./react-server";

// builtin context system only for synchronus access.
// for now, avoid relying on async hooks since it's not supported on stackblitz yet.

let currentActionContext: ActionContext | undefined;

export function runActionContext<T>(context: ActionContext, f: () => T): T {
  tinyassert(!currentActionContext);
  currentActionContext = context;
  try {
    return f();
  } finally {
    currentActionContext = undefined;
  }
}

export function useActionContext() {
  tinyassert(currentActionContext);
  return currentActionContext;
}
