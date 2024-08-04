import { objectMapKeys } from "@hiogawa/utils";

const glob = import.meta.glob<typeof import("*.mdx")>(
  "/src/routes/test/mdx/dynamic/_posts/*.(md|mdx)",
);

export function getPosts() {
  return objectMapKeys(glob, (_v, k) => k.split("/").at(-1)!.split(".")[0]!);
}
