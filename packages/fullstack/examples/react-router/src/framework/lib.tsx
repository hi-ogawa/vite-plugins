import { useMatches } from "react-router";
import type { Handle } from "../routes";

export function Links() {
  const matches = useMatches();
  const handles = matches.map((m) => m.handle as Handle);
  return (
    <>
      {handles
        .flatMap((h) => [
          ...h.assets.js,
          ...(h.assets.entry ? [{ href: h.assets.entry }] : []),
        ])
        .map((attrs) => (
          <link
            {...attrs}
            rel="modulepreload"
            key={attrs.href}
            crossOrigin=""
          />
        ))}
      {handles
        .map((h) => h.assets.css)
        .flat()
        .map((attrs) => (
          <link {...attrs} rel="stylesheet" key={attrs.href} crossOrigin="" />
        ))}
    </>
  );
}
