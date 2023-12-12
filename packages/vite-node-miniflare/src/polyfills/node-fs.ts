export const existsSync = () => {
  return false;
};

export const promises = new Proxy(() => {}, {
  get(_target, p, _receiver) {
    throw new Error(`todo: node:fs - promises.${String(p)}`);
  },
});

export default new Proxy(() => {}, {
  get(_target, p, _receiver) {
    throw new Error(`todo: node:fs - ${String(p)}`);
  },
});
