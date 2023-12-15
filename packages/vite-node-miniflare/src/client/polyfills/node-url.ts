import type url from "node:url";
import { tinyassert } from "@hiogawa/utils";

export const fileURLToPath: typeof url.fileURLToPath = (url) => {
  const s = url.toString();
  // console.log("@@@ fileURLToPath", s);
  tinyassert(s.startsWith("file://"), s);
  return s.slice("file://".length);
};

export const pathToFileURL: typeof url.pathToFileURL = (path) => {
  // TODO
  // Somehow Remix's virtual module resolveId ends up here "\0virtual:remix/server-build".
  // Note that this doesn't happen on my own vite-glob-routes virtual modules,
  // so it's unlikely that this is a vite-node bug.
  // For now, stripping off "\0" convention seems to work.
  // console.log("@@@ pathToFileURL", path.replaceAll("\0", "[#]"));
  path = path.replaceAll("\0", "");
  return new URL("file://" + path);
};
