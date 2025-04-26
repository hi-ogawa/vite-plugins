import * as ReactClient from "@hiogawa/vite-rsc/react/ssr";

/* @__NO_SIDE_EFFECTS__ */
export function createServerReference(id: string) {
  return ReactClient.createServerReference(id);
}
