Pre bundle CJS dependencies since `ssr.optimizeDeps` doesn't seem to work when running vite-node client on workered

## todo

- [ ] does vite expose such functionality?
  - explicitly pre-bundle cjs + get filepath to `.vite/deps`
- [ ] execute modules to extract export names
  - run with `node --conditions=browser`?
- [ ] auto generate everything by giving a set of modules (e.g. `react`, `react/jsx-runtime`, `react-dom/server`)
  - https://tsup.egoist.dev/#javascript-api
- [ ] do all this as vite plugin

### examples

```sh
$ node --conditions=browser --input-type=module -e 'console.log(Object.keys(await import("react-dom/server")))'
[
  'default',
  'renderToNodeStream',
  'renderToReadableStream',
  'renderToStaticMarkup',
  'renderToStaticNodeStream',
  'renderToString',
  'version'
]
```
