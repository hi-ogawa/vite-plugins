# @hiogawa/react-server

[Try it on Stackblitz](https://stackblitz.com/github/hi-ogawa/vite-plugins/tree/main/packages/react-server/examples/starter)

![image](https://github.com/hi-ogawa/vite-plugins/assets/4232207/9417d47c-6a7a-42c0-af25-b33e527420e4)

See https://github.com/hi-ogawa/vite-plugins/issues/174 for known issues.

## Examples

- [react-server-demo-remix-tutorial](https://github.com/hi-ogawa/react-server-demo-remix-tutorial/)
  - [Stackblitz](https://stackblitz.com/https://github.com/hi-ogawa/react-server-demo-remix-tutorial)
  - https://react-server-demo-remix-tutorial.hiro18181.workers.dev
- [`./examples/basic`](./examples/basic)
  - [Stackblitz](https://stackblitz.com/github/hi-ogawa/vite-plugins/tree/main/packages/react-server/examples/starter)
  - https://rsc-experiment.hiro18181.workers.dev/test
  - https://rsc-experiment-hiroshi.vercel.app/test
- [`./examples/starter`](./examples/starter)
  - [Stackblitz](https://stackblitz.com/github/hi-ogawa/vite-plugins/tree/main/packages/react-server/examples/basic)
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

## Conventions

- `src/entry-client.tsx`
- `src/entry-react-server.tsx`
- `src/routes/**/(page|layout|error).tsx`
- `"use client"`
- `"use server"`

## Development

```sh
# NO_DTS=1
pnpm -C packages/react-server dev

# DEBUG=react-server:*
pnpm -C packages/react-server/examples/basic dev
```

## Credits

- https://github.com/dai-shi/waku
- https://github.com/lazarv/react-server
- https://nextjs.org/docs/app
- https://github.com/nksaraf/vinxi
- https://github.com/cyco130/vite-rsc
- https://github.com/facebook/react/pull/26926
- https://github.com/devongovett/rsc-html-stream
