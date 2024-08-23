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
