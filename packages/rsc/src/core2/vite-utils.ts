// copied from vite

import fs from "node:fs";
import path from "node:path";
import type { DevEnvironment, Rollup } from "vite";

export const VALID_ID_PREFIX = `/@id/`;

export const NULL_BYTE_PLACEHOLDER = `__x00__`;

export const FS_PREFIX = `/@fs/`;

export function wrapId(id: string): string {
  return id.startsWith(VALID_ID_PREFIX)
    ? id
    : VALID_ID_PREFIX + id.replace("\0", NULL_BYTE_PLACEHOLDER);
}

export function unwrapId(id: string): string {
  return id.startsWith(VALID_ID_PREFIX)
    ? id.slice(VALID_ID_PREFIX.length).replace(NULL_BYTE_PLACEHOLDER, "\0")
    : id;
}

export function withTrailingSlash(path: string): string {
  if (path[path.length - 1] !== "/") {
    return `${path}/`;
  }
  return path;
}

const postfixRE = /[?#].*$/;
export function cleanUrl(url: string): string {
  return url.replace(postfixRE, "");
}

export function normalizeResolvedIdToUrl(
  environment: DevEnvironment,
  url: string,
  resolved: Rollup.PartialResolvedId,
): string {
  const root = environment.config.root;
  const depsOptimizer = environment.depsOptimizer;

  // normalize all imports into resolved URLs
  // e.g. `import 'foo'` -> `import '/@fs/.../node_modules/foo/index.js'`
  if (resolved.id.startsWith(withTrailingSlash(root))) {
    // in root: infer short absolute path from root
    url = resolved.id.slice(root.length);
  } else if (
    depsOptimizer?.isOptimizedDepFile(resolved.id) ||
    // vite-plugin-react isn't following the leading \0 virtual module convention.
    // This is a temporary hack to avoid expensive fs checks for React apps.
    // We'll remove this as soon we're able to fix the react plugins.
    (resolved.id !== "/@react-refresh" &&
      path.isAbsolute(resolved.id) &&
      fs.existsSync(cleanUrl(resolved.id)))
  ) {
    // an optimized deps may not yet exists in the filesystem, or
    // a regular file exists but is out of root: rewrite to absolute /@fs/ paths
    url = path.posix.join(FS_PREFIX, resolved.id);
  } else {
    url = resolved.id;
  }

  // if the resolved id is not a valid browser import specifier,
  // prefix it to make it valid. We will strip this before feeding it
  // back into the transform pipeline
  if (url[0] !== "." && url[0] !== "/") {
    url = wrapId(resolved.id);
  }

  return url;
}
