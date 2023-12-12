export const dirname = () => {
  throw new Error("todo dirname");
};

export default new Proxy(() => {}, {
  get(target, p, receiver) {
    throw new Error(`todo: node:path - ${String(p)}`);
  },
});
