import { mergeAssets } from "@hiogawa/vite-plugin-fullstack/runtime";
import { useMatches } from "react-router";
import type { CustomHandle } from "../routes";

export function Links() {
  const matches = useMatches();
  const handles = matches.map((m) => m.handle as CustomHandle);
  const assets = mergeAssets(...handles.flatMap((h) => h.assets));
  return (
    <>
      {assets.js.map((attrs) => (
        <link {...attrs} rel="modulepreload" key={attrs.href} crossOrigin="" />
      ))}
      {assets.css.map((attrs) => (
        <link {...attrs} rel="stylesheet" key={attrs.href} crossOrigin="" />
      ))}
    </>
  );
}
