export function getBrowserPreamble(): string {
  let code = ``;
  // avoid throwing when accessing `__webpack_require__` on import side effect
  // (note that __webpack_require__ is later properly defined by packages/rsc/src/core/client-browser.ts)
  // https://github.com/facebook/react/blob/a9bbe34622885ef5667d33236d580fe7321c0d8b/packages/react-server-dom-webpack/src/client/ReactFlightClientConfigBundlerWebpackBrowser.js#L16-L17
  code += `self.__webpack_require__ = () => {};\n`;
  // use __viteRscImport to avoid Vite adding `?import` query, which causes duplicate modules on browser.
  code += `self.__viteRscImport = (id) => import(id);\n`;
  return code;
}
