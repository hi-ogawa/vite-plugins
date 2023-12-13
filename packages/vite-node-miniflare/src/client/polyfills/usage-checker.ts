export function createUsageChecker(message: string): any {
  return new Proxy(() => {}, {
    apply(_target, _thisArg, _argArray) {
      throw new Error(`todo: ${message} - apply`);
    },
    get(_target, p, _receiver) {
      throw new Error(`todo: ${message} - get - ${String(p)}`);
    },
  });
}
