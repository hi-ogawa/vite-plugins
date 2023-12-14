export function createUsageChecker(message: string): any {
  return new Proxy(() => {}, {
    apply(_target, _thisArg, argArray) {
      throw new Error(`todo: ${message} - apply - ` + argArray.join(" "));
    },
    get(_target, p, _receiver) {
      throw new Error(`todo: ${message} - get - ${String(p)}`);
    },
  });
}
