import clientReferences from "virtual:vite-rsc/client-references";
import type { CallServerCallback } from "../types";
import { withBase } from "./utils/base";

export async function preloadModule(id: string): Promise<unknown> {
  if (import.meta.env.DEV) {
    return __vite_rsc_raw_import__(withBase(id));
  } else {
    const import_ = clientReferences[id];
    if (!import_) {
      throw new Error(`client reference not found '${id}'`);
    }
    return import_();
  }
}

let callServer_!: CallServerCallback;

export const callServer: CallServerCallback = (...args): any => {
  if (!callServer_) {
    throw new Error("'callServer' is not set");
  }
  return callServer_(...args);
};

export function setServerCallback(fn: CallServerCallback): void {
  callServer_ = fn;
}

export function findSourceMapURL(
  filename: string,
  environmentName: string,
): string | null {
  if (!import.meta.env.DEV) return null;
  if (!findSourceMapURLEndpoint) {
    throw new Error("'findSourceMapURLEndpoint' is not set");
  }
  const url = new URL(findSourceMapURLEndpoint);
  url.searchParams.set("filename", filename);
  url.searchParams.set("environmentName", environmentName);
  return url.toString();
}

let findSourceMapURLEndpoint!: string;

export function setFindSourceMapURLEndpoint(endpoint: string): void {
  findSourceMapURLEndpoint = endpoint;
}
