import { useMatches } from "react-router";
import type { AssetsHandle } from "../routes";

export function Links() {
  const matches = useMatches();
  const handles = matches.map((m) => m.handle as AssetsHandle);
  return (
    <>
      {handles
        .flatMap((h) => [
          ...h.assets.client.js,
          ...(h.assets.client.entry ? [{ href: h.assets.client.entry }] : []),
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
        .map((h) => h.assets.server.css)
        .flat()
        .map((attrs) => (
          <link {...attrs} rel="stylesheet" key={attrs.href} crossOrigin="" />
        ))}
    </>
  );
}
