import { escapeRegExp } from "@hiogawa/utils";

// inspired by https://github.com/debug-js/debug/

// cli
//   DEBUG=react-server:* pnpm dev
// browser devtool
//   __DEBUG = "react-server:*"

function createDebugFn(base: string, sub: string) {
  const pattern = new RegExp(
    `\\b(${escapeRegExp(base + ":*")}|${escapeRegExp(base + ":" + sub)}\\b)`,
  );
  return (...args: unknown[]) => {
    const flag =
      globalThis.process?.env?.["DEBUG"] ?? (globalThis as any).__DEBUG;
    if (typeof flag === "string" && flag.match(pattern)) {
      console.log(`⊳ ${base}:${sub}`, ...args);
    }
  };
}

function createDebug<K extends string>(
  base: string,
  subs: Readonly<[K, ...K[]]>,
): Debug<K> {
  const debug = createDebugFn(base, "default") as any;
  for (const sub of subs) {
    debug[sub] = createDebugFn(base, sub);
  }
  return debug;
}

type Debug<K extends string> = ((...args: unknown[]) => void) & {
  [k in K]: (...args: unknown[]) => void;
};

export const debug = createDebug("react-server", ["plugin", "ssr", "browser"]);
