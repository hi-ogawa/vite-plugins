// @ts-ignore
import metadataFiles from "virtual:metadata-files";
import { objectHas } from "@hiogawa/utils";
import type { MetadataFilesExports } from "./plugin";
import { type Metadata, type Viewport, toViewportMetaContent } from "./utils";

export async function MetadataLinks({
  metadata,
  viewport,
}: {
  metadata: Metadata;
  viewport: Viewport;
}) {
  const title = getTitle(metadata);
  return (
    <>
      {(metadataFiles as MetadataFilesExports).favicon && (
        <link rel="icon" href="/favicon.ico" sizes="any" />
      )}
      <meta name="viewport" content={toViewportMetaContent(viewport)} />
      {typeof title === "string" && <title>{title}</title>}
      {typeof metadata.description === "string" && (
        <meta name="description" content={metadata.description} />
      )}
    </>
  );
}

function getTitle(m: Metadata): string | null {
  return typeof m.title === "string"
    ? m.title
    : objectHas(m.title, "default")
      ? m.title.default
      : null;
}
