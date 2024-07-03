// @ts-ignore
import metadataFiles from "virtual:metadata-files";
import { objectHas } from "@hiogawa/utils";
import type { MetadataFilesExports } from "./plugin";
import type { Metadata } from "./utils";

export function renderMetadata(m: Metadata) {
  const title =
    typeof m.title === "string"
      ? m.title
      : objectHas(m.title, "default")
        ? m.title.default
        : null;
  return (
    <>
      {(metadataFiles as MetadataFilesExports).favicon && (
        <link rel="icon" href="/favicon.ico" sizes="any" />
      )}
      {typeof title === "string" && <title>{title}</title>}
      {typeof m.description === "string" && (
        <meta name="description" content={m.description} />
      )}
    </>
  );
}
