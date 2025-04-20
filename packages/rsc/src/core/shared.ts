// use special prefix to switch client/server reference loading inside __webpack_require__
export const SERVER_REFERENCE_PREFIX = "$$server:";

// cache bust memoized require promise during dev
export function createReferenceCacheTag(): string {
  const cache = Math.random().toString(36).slice(2);
  return "$$cache=" + cache;
}

export function removeReferenceCacheTag(id: string): string {
  return id.split("$$cache=")[0]!;
}
