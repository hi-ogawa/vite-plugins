import type url from "node:url";
import { tinyassert } from "@hiogawa/utils";

export const fileURLToPath: typeof url.fileURLToPath = (url) => {
  const s = url.toString();
  tinyassert(s.startsWith("file://"));
  return s.slice("file://".length);
  throw new Error("todo fileURLToPath");
};

export const pathToFileURL: typeof url.pathToFileURL = (path) => {
  return new URL("file://" + path);
  throw new Error("todo pathToFileURL");
};
