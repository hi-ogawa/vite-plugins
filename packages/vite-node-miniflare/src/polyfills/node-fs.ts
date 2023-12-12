export const existsSync = () => {
  return false;
  throw new Error("todo existsSync")
};

export const promises = new Proxy(() => {}, {
  get(target, p, receiver) {
    throw new Error(`todo: node:fs - promises.${String(p)}`);
  },
});

export default new Proxy(() => {}, {
  get(target, p, receiver) {
    throw new Error(`todo: node:fs - ${String(p)}`);
  },
});
