# Changelog

## v0.0.10 (2024-07-14)

- feat: vercel node runtime adapter ([#555](https://github.com/hi-ogawa/vite-plugins/pull/555))
- fix: more compat exports (e.g. `next/server.js`, `Lusitana` font) ([#559](https://github.com/hi-ogawa/vite-plugins/pull/559))

## v0.0.9 (2024-07-11)

- feat: support JSX in `.js` file ([#539](https://github.com/hi-ogawa/vite-plugins/pull/539))
- feat!: expose `ReactServerPluginOptions` (require explicit prerender config) ([#538](https://github.com/hi-ogawa/vite-plugins/pull/538))
- chore(next): re-export `useServerInsertedHTML` ([#537](https://github.com/hi-ogawa/vite-plugins/pull/537))
- fix(next): fix `useSelectedLayoutSegment` type compat ([#525](https://github.com/hi-ogawa/vite-plugins/pull/525))

## v0.0.8 (2024-07-09)

- refactor!: string only for `RevalidationType` ([#499](https://github.com/hi-ogawa/vite-plugins/pull/499))

## v0.0.7 (2024-07-04)

- feat: support `Image.priority` ([#487](https://github.com/hi-ogawa/vite-plugins/pull/487))
- feat: support `headers`, `cookies` and `revalidatePath` ([#484](https://github.com/hi-ogawa/vite-plugins/pull/484))
- fix: fix server-only and client-only ([#480](https://github.com/hi-ogawa/vite-plugins/pull/480))
- fix: preserve cli exit code ([#480](https://github.com/hi-ogawa/vite-plugins/pull/480))
- fix: correctly setup ssg html on vercel adapter ([#475](https://github.com/hi-ogawa/vite-plugins/pull/475))

## v0.0.6 (2024-07-01)

- feat: enable prerender for `generateStaticParams` ([#472](https://github.com/hi-ogawa/vite-plugins/pull/472))

## v0.0.5 (2024-06-30)

- fix: fix `useSelectedLayoutSegment` ([#464](https://github.com/hi-ogawa/vite-plugins/pull/464))
- feat: adapters for deployment (vercel edge and cloudflare) ([#459](https://github.com/hi-ogawa/vite-plugins/pull/459))
- feat: loading and template file convention ([#456](https://github.com/hi-ogawa/vite-plugins/pull/456))
- feat: add hooks to provide current route params ([#453](https://github.com/hi-ogawa/vite-plugins/pull/453))

## v0.0.4 (2024-06-27)

- fix: support `app/favicon.ico` ([#448](https://github.com/hi-ogawa/vite-plugins/pull/448))
- fix: shim `cookies` using `@edge-runtime/cookies` ([#447](https://github.com/hi-ogawa/vite-plugins/pull/447))

## v0.0.3 (2024-06-27)

- feat: support non esm project ([#414](https://github.com/hi-ogawa/vite-plugins/pull/414))
- feat: shim more api ([#444](https://github.com/hi-ogawa/vite-plugins/pull/444))
- feat: auto setup vite-tsconfig-paths ([#443](https://github.com/hi-ogawa/vite-plugins/pull/443))
- feat: auto setup vite.config.ts ([#442](https://github.com/hi-ogawa/vite-plugins/pull/442))
- feat: ambient type via `next-env.d.ts` ([#439](https://github.com/hi-ogawa/vite-plugins/pull/439))

## v0.0.2 (2024-06-26)

- refactor: move vite to peer deps ([#432](https://github.com/hi-ogawa/vite-plugins/pull/432))

## v0.0.1 (2024-06-25)

- fix: relax peer deps ([#424](https://github.com/hi-ogawa/vite-plugins/pull/424))
