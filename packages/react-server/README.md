# @hiogawa/react-server

[Try it on Stackblitz](https://stackblitz.com/edit/github-4eut84?file=src%2Froutes%2Fserver-action%2Fserver.tsx)

![image](https://github.com/hi-ogawa/vite-plugins/assets/4232207/119a42ee-d68e-401d-830a-161cc53c8b24)

See https://github.com/hi-ogawa/vite-plugins/issues/174 for known issues.

## Quick start

See also [`./examples/starter`](./examples/starter).

```sh
# download template
npx degit@latest hi-ogawa/vite-plugins/packages/react-server/examples/starter my-project
cd my-project

# development
npm i
npm run dev

# build and preview
npm run build
npm run preview
```

## Conventions

- `index.html`
- `src/entry-client.tsx`
- `src/routes/**/(page|layout).tsx`
- `"use client"`
- `"use server"`

## Examples

- [`./examples/starter`](./examples/starter)
- [`./examples/basic`](./examples/basic)

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
