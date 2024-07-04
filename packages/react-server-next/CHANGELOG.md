# Changelog

## v0.0.7

- feat: support `Image.priority` ([#487](https://github.com/hi-ogawa/vite-plugins/pull/487))
- feat: support `headers`, `cookies` and `revalidatePath` ([#484](https://github.com/hi-ogawa/vite-plugins/pull/484))
- fix: fix server-only and client-only ([#480](https://github.com/hi-ogawa/vite-plugins/pull/480))
- fix: preserve cli exit code ([#480](https://github.com/hi-ogawa/vite-plugins/pull/480))
- fix: correctly setup ssg html on vercel adapter ([#475](https://github.com/hi-ogawa/vite-plugins/pull/475))

## v0.0.6

- feat: enable prerender for `generateStaticParams` ([#472](https://github.com/hi-ogawa/vite-plugins/pull/472))

## v0.0.5

- fix: fix `useSelectedLayoutSegment` ([#464](https://github.com/hi-ogawa/vite-plugins/pull/464))
- feat: adapters for deployment (vercel edge and cloudflare) ([#459](https://github.com/hi-ogawa/vite-plugins/pull/459))
- feat: loading and template file convention ([#456](https://github.com/hi-ogawa/vite-plugins/pull/456))
- feat: add hooks to provide current route params ([#453](https://github.com/hi-ogawa/vite-plugins/pull/453))

## v0.0.4

- fix: support `app/favicon.ico` ([#448](https://github.com/hi-ogawa/vite-plugins/pull/448))
- fix: shim `cookies` using `@edge-runtime/cookies` ([#447](https://github.com/hi-ogawa/vite-plugins/pull/447))

## v0.0.3

- feat: support non esm project ([#414](https://github.com/hi-ogawa/vite-plugins/pull/414))
- feat: shim more api ([#444](https://github.com/hi-ogawa/vite-plugins/pull/444))
- feat: auto setup vite-tsconfig-paths ([#443](https://github.com/hi-ogawa/vite-plugins/pull/443))
- feat: auto setup vite.config.ts ([#442](https://github.com/hi-ogawa/vite-plugins/pull/442))
- feat: ambient type via `next-env.d.ts` ([#439](https://github.com/hi-ogawa/vite-plugins/pull/439))

## v0.0.2

- refactor: move vite to peer deps ([#432](https://github.com/hi-ogawa/vite-plugins/pull/432))

## v0.0.1

- fix: relax peer deps ([#424](https://github.com/hi-ogawa/vite-plugins/pull/424))
