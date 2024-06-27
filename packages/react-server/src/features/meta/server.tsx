import { objectHas } from "@hiogawa/utils";
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
      {typeof title === "string" && <title>{title}</title>}
      {typeof m.description === "string" && (
        <meta name="description" content={m.description} />
      )}
    </>
  );
}
