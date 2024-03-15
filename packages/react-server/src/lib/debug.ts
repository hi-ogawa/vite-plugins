import { escapeRegExp } from "@hiogawa/utils";

// inspired by https://github.com/debug-js/debug/

// cli
//   DEBUG=react-server:* pnpm dev
// browser devtool
//   __DEBUG = "react-server:*"

function createDebugFn(name: string, pattern: RegExp) {
  return (...args: unknown[]) => {
    const flag =
      globalThis.process?.env?.["DEBUG"] ?? (globalThis as any).__DEBUG;
    if (typeof flag === "string" && flag.match(pattern)) {
      console.log(`⊳ ${name}`, ...args);
    }
  };
}

function createDebug<K extends string>(
  base: string,
  subs: Readonly<[K, ...K[]]>
): Debug<K> {
  const debug = createDebugFn(
    base,
    new RegExp(`\\b${escapeRegExp(base)}\\b`)
  ) as any;
  for (const sub of subs) {
    debug[sub] = createDebugFn(
      `${base}:${sub}`,
      new RegExp(
        `\\b(${escapeRegExp(base + ":*")}|${escapeRegExp(base + ":" + sub)}\\b)`
      )
    );
  }
  return debug;
}

type Debug<K extends string> = ((...args: unknown[]) => void) & {
  [k in K]: (...args: unknown[]) => void;
};

export const debug = createDebug("react-server", [
  "plugin",
  "rsc",
  "ssr",
  "browser",
]);
