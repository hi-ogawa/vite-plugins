/// <reference types="vite/client" />
/// <reference types="@hiogawa/vite-rsc/types" />

declare module "virtual:vite-rsc-waku/server-entry" {
  import type { unstable_defineEntries } from "waku/minimal/server";
  const default_: ReturnType<typeof unstable_defineEntries>;
  export default default_;
}

declare module "virtual:vite-rsc-waku/client-entry" {}
