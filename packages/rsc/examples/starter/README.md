# Vite + RSC

This example shows how to setup a React application with [Server Component](https://react.dev/reference/rsc/server-components) features on Vite using [`@hiogawa/vite-rsc`](https://github.com/hi-ogawa/vite-plugins/tree/main/packages/rsc).

```sh
# run dev server
npm run dev

# build for production and preview
npm run build
npm run preview
```

## Tips

- [`./src/framework/entry.{browser,rsc,ssr}.tsx`](./src/framework) (with inline comments) provides an overview of how low level RSC (React flight) API can be used to build RSC framework.
- You can use [`vite-plugin-inspect`](https://github.com/antfu-collective/vite-plugin-inspect) (available at http://localhost:5173/__inspect/) to see how `"use client"` and `"use server"` directives are internally transformed.
