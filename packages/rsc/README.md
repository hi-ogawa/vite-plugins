# @hiogawa/vite-rsc

Vite RSC plugin without framework

## examples

- [`./examples/basic`](./examples/basic)
- [`./examples/react-router`](./examples/react-router)

## high level API

- `@hiogawa/vite-rsc/{plugin,browser,ssr,rsc}`
  - Framework-less rsc plugin, runtime, and re-export of react-server-dom API with types. The plugin is "opinionated" in the sense that it's not necessary compose-able with existing frameworks or plugins, but the implementation is minimal.
  - See [`examples/react-router`](./examples/react-router) for the usage
- `@hiogawa/vite-rsc/extra/{browser,ssr,rsc}`
  - Rsc helper API similar to [`@parcel/rsc`](https://parceljs.org/recipes/rsc). less flexible but easier to play with.
  - See [`examples/basic`](./examples/basic) for the usage

## low level API

Low level API is mostly consumed internally by high level API, but they can be used when writing own plugins. My plan is to propose `react-server-dom-vite` with mostly same runtime API without the need of plugin.

- `@hiogawa/vite-rsc/core/{plugin,browser,ssr,rsc}`
  - workaround to make async module loading with dev invalidation work on top of `react-server-dom-webpack`
- `@hiogawa/vite-rsc/react/{browser,ssr,rsc}`
  - re-export of `react-server-dom-webpack` API with pre-defined options (e.g. manifest and call server) to work with `core`
