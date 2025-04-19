export function setServerCallback(fn: any): void {
  globalThis.__viteRscCallServer = fn;
}
