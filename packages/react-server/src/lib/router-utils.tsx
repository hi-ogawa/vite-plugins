/**
 * @example
 * "/hello/world" =>
 *    [
 *      ["/",            ""],
 *      ["/hello",       "hello"],
 *      ["/hello/world", "world"],
 *    ]
 */
export function getPathPrefixes(pathname: string) {
  const keys = normalizePathname(pathname).split("/");
  const segments: [string, string][] = [];
  let prefix = "";
  for (const key of keys) {
    prefix += "/" + key;
    segments.push([prefix, key]);
  }
  return segments;
}

// strip trailing slash (including "/" => "")
export function normalizePathname(pathname: string) {
  return pathname.replaceAll(/\/*$/g, "");
}
