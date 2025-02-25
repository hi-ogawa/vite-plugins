// cf. https://github.com/vercel/next.js/blob/4b7924b15593322633fe2847f52bac8dbd5d9047/packages/next/src/lib/metadata/types/metadata-interface.ts#L40
export type Metadata = {
  title?: null | string | { default: string; [k: string]: unknown };
  description?: null | string;
  metadataBase?: null | URL;
  openGraph?: null | MetadataOpenGraph;
  twitter?: null | MetadataTwitter;
  [k: string]: unknown;
};

type MetadataOpenGraph = {
  title?: string;
  description?: string;
  images?: Arrayable<string | URL>;
  [k: string]: unknown;
};

type MetadataTwitter = {
  title?: string;
  description?: string;
  images?: Arrayable<string | URL>;
  card?: string;
  [k: string]: unknown;
};

type Arrayable<T> = T | Array<T>;

export function normalizeMetadata(m: Metadata): void {
  // copy from openGraph to twitter
  // cf. https://github.com/vercel/next.js/blob/afc73d5eadb108f10a22b223cbcb55f491bf5431/packages/next/src/lib/metadata/resolve-metadata.ts#L579-L652
  if (m.openGraph) {
    for (const key of ["title", "description", "images"] as const) {
      if (m.openGraph[key] && !m.twitter?.[key]) {
        m.twitter ??= {};
        m.twitter[key] = m.openGraph[key] as any;
      }
    }
  }
}
