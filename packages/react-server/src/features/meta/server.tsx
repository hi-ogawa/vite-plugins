import { objectHas } from "@hiogawa/utils";
import { type Metadata, normalizeMetadata } from "./utils";

export function renderMetadata(m: Metadata) {
  normalizeMetadata(m);

  const title =
    typeof m.title === "string"
      ? m.title
      : objectHas(m.title, "default")
        ? m.title.default
        : null;

  // cf. https://github.com/vercel/next.js/blob/a6b2e8bf85316855995fad84ebfc93c62ab3ce04/packages/next/src/lib/metadata/resolvers/resolve-url.ts
  const metadataBase = new URL(
    m.metadataBase ??
      globalThis?.process?.env?.["METADATA_BASE"] ??
      "http://localhost:5243",
  );

  return (
    <>
      {typeof title === "string" && <title>{title}</title>}
      {typeof m.description === "string" && (
        <meta name="description" content={m.description} />
      )}
      {typeof m.openGraph?.title === "string" && (
        <meta property="og:title" content={m.openGraph.title} />
      )}
      {typeof m.openGraph?.description === "string" && (
        <meta property="og:description" content={m.openGraph.description} />
      )}
      {typeof m.openGraph?.images !== "undefined" &&
        [m.openGraph.images]
          .flat()
          .map((image, i) => (
            <meta
              key={i}
              property="og:image"
              content={new URL(image, metadataBase).href}
            />
          ))}
      {typeof m.twitter?.card === "string" && (
        <meta name="twitter:card" content={m.twitter.card} />
      )}
      {typeof m.twitter?.title === "string" && (
        <meta name="twitter:title" content={m.twitter.title} />
      )}
      {typeof m.twitter?.description === "string" && (
        <meta name="twitter:description" content={m.twitter.description} />
      )}
      {typeof m.twitter?.images !== "undefined" &&
        [m.twitter.images]
          .flat()
          .map((image, i) => (
            <meta
              key={i}
              name="twitter:image"
              content={new URL(image, metadataBase).href}
            />
          ))}
    </>
  );
}
