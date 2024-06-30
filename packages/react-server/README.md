# @hiogawa/react-server

## Examples

- [`next-app-router-playground`](https://github.com/hi-ogawa/next-app-router-playground/pull/1)
  - https://app-router-vite.vercel.app
- [`rsc-on-vite/remix-tutorial`](https://github.com/hi-ogawa/rsc-on-vite/tree/main/remix-tutorial)
  - https://react-server-demo-remix-tutorial.hiro18181.workers.dev
- [`./examples/basic`](./examples/basic)
  - [Stackblitz](https://stackblitz.com/github/hi-ogawa/vite-plugins/tree/main/packages/react-server/examples/basic)
  - https://rsc-experiment.hiro18181.workers.dev/test
  - https://rsc-experiment-hiroshi.vercel.app/test
- [`./examples/starter`](./examples/starter)
  - [Stackblitz](https://stackblitz.com/github/hi-ogawa/vite-plugins/tree/main/packages/react-server/examples/starter)
  - https://react-server-starter.hiro18181.workers.dev

## Quick start

See also [`./examples/starter`](./examples/starter).

```sh
# download template
npx tiged hi-ogawa/vite-plugins/packages/react-server/examples/starter my-app
cd my-app

# development
pnpm i
pnpm dev

# build and preview
pnpm build
pnpm preview
```

## Development

```sh
# NO_DTS=1 to skip type error
pnpm -C packages/react-server dev

# DEBUG=react-server:*
pnpm -C packages/react-server/examples/basic dev

# release
pnpm changelog --dir packages/react-server
pnpm publish packages/react-server
```
