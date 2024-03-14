// minimal https://github.com/debug-js/debug/

// node
//   DEBUG=react-server:* pnpm dev
// browser
//   __DEBUG = "react-server:*"

const base = "react-server";

export function createDebug(tag: string) {
  const name = `${base}:${tag}`;
  return (...args: unknown[]) => {
    const flag =
      globalThis.process?.env?.["DEBUG"] ?? (globalThis as any).__DEBUG ?? "";
    if ([`${base}:*`, name].some((s) => flag.includes(s))) {
      console.log(`⊳⊳ ${name}`, ...args);
    }
  };
}
