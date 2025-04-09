export function getBrowserPreamble(): string {
  return `self.__viteRscImport = (id) => import(id);`;
}
