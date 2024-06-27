import type { Metadata } from "./utils";

export function renderMetadata(m: Metadata) {
  return (
    <>
      {typeof m.title === "string" && <title>{m.title}</title>}
      {typeof m.description === "string" && (
        <meta name="description" content={m.description} />
      )}
    </>
  );
}
