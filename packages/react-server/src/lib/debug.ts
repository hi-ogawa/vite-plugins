// minimal https://github.com/debug-js/debug/

const prefix = "react-server";

export function createDebug(tag: string) {
  return (...args: unknown[]) => {
    // TODO: browser
    const flag = globalThis.process?.env?.["DEBUG"] ?? "";
    if ([`${prefix}:*`, `${prefix}:${tag}`].some((s) => flag.includes(s))) {
      console.log(`⊳⊳ ${prefix}:${tag}`, ...args);

    }
  };
}
