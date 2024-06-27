import type { Metadata } from "./utils";

export function renderMetadata(m: Metadata) {
  return (
    <>
      {m.title && <title>{m.title}</title>}
      {m.description && <meta name="description" content={m.description} />}
    </>
  );
}
