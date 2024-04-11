import { tinyassert } from "@hiogawa/utils";

const ACTION_ID_PREFIX = "$ACTION_ID_";

export function injectActionId(id: string) {
  return ACTION_ID_PREFIX + id;
}

// TODO: use decodeAction
// https://github.com/facebook/react/blob/da69b6af9697b8042834644b14d0e715d4ace18a/packages/react-server/src/ReactFlightActionServer.js#L78
export function ejectActionId(formData: FormData) {
  let id: string | undefined;
  formData.forEach((_v, k) => {
    if (k.startsWith(ACTION_ID_PREFIX)) {
      id = k.slice(ACTION_ID_PREFIX.length);
      formData.delete(k);
    }
  });
  tinyassert(id);
  return id;
}

const ACTION_ID_HEADER = "x-server-action-id";

export function wrapStreamActionRequest(id: string) {
  return { [ACTION_ID_HEADER]: id };
}

export function unwrapStreamActionRequest(request: Request) {
  const id = request.headers.get(ACTION_ID_HEADER);
  if (id) {
    return { id };
  }
  return false;
}
