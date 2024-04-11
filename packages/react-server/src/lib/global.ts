import type { ViteDevServer } from "vite";
import type {
  serverReferenceWebpackChunkLoad,
  serverReferenceWebpackRequire,
} from "../features/server-action/react-server";
import type { CallServerCallback } from "./types";

// centeralize quick global hacks...

export const __global: {
  dev: {
    server: ViteDevServer;
    reactServer: ViteDevServer;
  };
  callServer: CallServerCallback;
  serverReferenceWebpackRequire: typeof serverReferenceWebpackRequire;
  serverReferenceWebpackChunkLoad: typeof serverReferenceWebpackChunkLoad;
} = ((globalThis as any).__REACT_SERVER_GLOBAL ??= {});
