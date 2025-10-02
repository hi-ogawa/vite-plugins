// https://github.com/vitejs/vite-plugin-vue/blob/06931b1ea2b9299267374cb8eb4db27c0626774a/packages/plugin-vue/src/utils/query.ts#L13
export function parseIdQuery(id: string): {
  filename: string;
  query: {
    [k: string]: string;
  };
} {
  if (!id.includes("?")) return { filename: id, query: {} };
  const [filename, rawQuery] = id.split(`?`, 2) as [string, string];
  const query = Object.fromEntries(new URLSearchParams(rawQuery));
  return { filename, query };
}

export type AssetsVirtual = {
  import: string;
  importer: string;
  environment: string;
  entry: string;
};

export function toAssetsVirtual(options: AssetsVirtual) {
  return `virtual:fullstack/assets?${new URLSearchParams(options)}&lang.js`;
}

export function parseAssetsVirtual(id: string): AssetsVirtual | undefined {
  if (id.startsWith("\0virtual:fullstack/assets?")) {
    return parseIdQuery(id).query as any;
  }
}
