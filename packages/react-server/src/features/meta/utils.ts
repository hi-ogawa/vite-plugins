// cf. https://github.com/vercel/next.js/blob/4b7924b15593322633fe2847f52bac8dbd5d9047/packages/next/src/lib/metadata/types/metadata-interface.ts#L40
export type Metadata = {
  title?: null | string | { default: string; [k: string]: unknown };
  description?: null | string;
  [k: string]: unknown;
};

// https://github.com/vercel/next.js/blob/b2625477c002343e7fe083204c45af1fdd7cd407/packages/next/src/lib/metadata/generate/basic.tsx#L32
export type Viewport = {
  [k: string]: unknown;
};

export function getDefaultViewport(): Viewport {
  return {
    width: "device-width",
    initialScale: 1,
  };
}

export function toViewportMetaContent(data: Viewport) {
  let entries: string[] = [];
  for (let [k, v] of Object.entries(data)) {
    if (v == null) {
      continue;
    }
    if (typeof v === "boolean") {
      v = v ? "yes" : "no";
    }
    entries.push(`${camelToCebab(k)}=${v}`);
  }
  return entries.join(", ");
}

// from jsCase to html-case
// https://github.com/hi-ogawa/js-utils/blob/fd9ff4925efe6bd6453bca606d5fbacdfeafa7f1/packages/tiny-react/src/ssr/render.ts#L127-L131
function camelToCebab(s: string) {
  return s.replace(/[A-Z]/g, "-$&").toLowerCase();
}
