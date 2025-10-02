import { useMatches } from "react-router";
import type { CustomHandle } from "../routes";

export function Links() {
  const matches = useMatches();
  const handles = matches.map((m) => m.handle as CustomHandle);
  const js = uniqBy(
    handles.flatMap((h) => h.assets.js),
    (a) => a.href,
  );
  const css = uniqBy(
    handles.flatMap((h) => h.assets.css),
    (a) => a.href,
  );
  return (
    <>
      {js.map((attrs) => (
        <link {...attrs} rel="modulepreload" key={attrs.href} crossOrigin="" />
      ))}
      {css.map((attrs) => (
        <link {...attrs} rel="stylesheet" key={attrs.href} crossOrigin="" />
      ))}
    </>
  );
}

// TODO: merging is cumbersome because of `data-vite-dev-id` :(
function uniqBy<T>(array: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>();
  return array.filter((item) => {
    const k = key(item);
    if (seen.has(k)) {
      return false;
    }
    seen.add(k);
    return true;
  });
}
