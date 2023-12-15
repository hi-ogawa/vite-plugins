import type url from "node:url";

export const fileURLToPath: typeof url.fileURLToPath = (url) => {
  const s = url.toString();
  if (!s.startsWith("file://")) {
    throw new Error(
      `[vite-node-miniflare] fileURLToPath - Unexpected url '${url}'`
    );
  }
  return s.slice("file://".length);
};

export const pathToFileURL: typeof url.pathToFileURL = (path) => {
  // since virtual module comes here as relative path (e.g. "\0virtual:xxx"),
  // we force absolute path format since Workerd throws when `new URL(file://relative)`.
  if (!path.startsWith("/")) {
    path = "/" + path;
  }
  return new URL("file://" + path);
};
