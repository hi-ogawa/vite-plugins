import { tinyassert } from "@hiogawa/utils";

// TODO
// it doesn't seem like a right way to do progressive enhancement for SSR
// but works okay for simple cases? (e.g. no `bind`?)
// cf. https://github.com/facebook/react/pull/26774
const ACTION_ID_PREFIX = "$ACTION_ID_";

export function injectActionId(formData: FormData, id: string) {
  formData.set(ACTION_ID_PREFIX + id, "");
}

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
