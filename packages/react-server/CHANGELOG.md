# Changelog

## v0.2.7

- feat: support non esm project ([#414](https://github.com/hi-ogawa/vite-plugins/pull/414))
- perf: set `build.write: false` during scan ([#445](https://github.com/hi-ogawa/vite-plugins/pull/445))

## v0.2.6

- feat: validate server-only and client-only ([#433](https://github.com/hi-ogawa/vite-plugins/pull/433))
- fix: fix initial server css crawling ([#425](https://github.com/hi-ogawa/vite-plugins/pull/425))
- fix: robust server reference build scan ([#431](https://github.com/hi-ogawa/vite-plugins/pull/431))
- fix: assert discovered server reference during build ([#430](https://github.com/hi-ogawa/vite-plugins/pull/430))
- fix: avoid ssr build on browser build failure ([#429](https://github.com/hi-ogawa/vite-plugins/pull/429))

## v0.2.5

- feat(next): create alias package ([#418](https://github.com/hi-ogawa/vite-plugins/pull/418))
- feat(next): compat link and navigation ([#420](https://github.com/hi-ogawa/vite-plugins/pull/420)), ([#421](https://github.com/hi-ogawa/vite-plugins/pull/421))

## v0.2.4

- feat(next): add partial Next.js compatibility ([#413](https://github.com/hi-ogawa/vite-plugins/pull/413))
- fix(next): force esbuild jsx transform ([#416](https://github.com/hi-ogawa/vite-plugins/pull/416))
- feat: refine route data revalidation `revalidate = (path)` ([#393](https://github.com/hi-ogawa/vite-plugins/pull/393))
- fix: set html response as charset=utf-8 ([#410](https://github.com/hi-ogawa/vite-plugins/pull/410))
- fix: enforce no trailing slash ([#392](https://github.com/hi-ogawa/vite-plugins/pull/392))
- fix: fix css virtual module invalidation ([#383](https://github.com/hi-ogawa/vite-plugins/pull/383))
- fix: tweak prerender output ([#376](https://github.com/hi-ogawa/vite-plugins/pull/376))
- chore: add `React.cache` example ([#400](https://github.com/hi-ogawa/vite-plugins/pull/400))
- chore: add `useOptimistic` demo ([#380](https://github.com/hi-ogawa/vite-plugins/pull/380))
- chore: cloudflare ssg hybrid deployment ([#375](https://github.com/hi-ogawa/vite-plugins/pull/375))
- chore: deploy basic example on vercel edge ([#371](https://github.com/hi-ogawa/vite-plugins/pull/371))
- chore(deps): update react 19.0.0-rc-c21bcd627b-20240624 ([#417](https://github.com/hi-ogawa/vite-plugins/pull/417))

## v0.2.3

- fix: merge Link props handlers ([#368](https://github.com/hi-ogawa/vite-plugins/pull/368))

## v0.2.2

- refactor: encode stream request metadata in http header ([#363](https://github.com/hi-ogawa/vite-plugins/pull/363))
- feat: prerender ([#357](https://github.com/hi-ogawa/vite-plugins/pull/357))
- refactor: simplify stream request convention (rebased) ([#361](https://github.com/hi-ogawa/vite-plugins/pull/361))
- fix: fix client css module hmr ([#346](https://github.com/hi-ogawa/vite-plugins/pull/346))
- fix: fix client css FOUC ([#342](https://github.com/hi-ogawa/vite-plugins/pull/342))
- feat: preload css ([#341](https://github.com/hi-ogawa/vite-plugins/pull/341))
- chore(deps): update react v19.0.0-rc.0 ([#343](https://github.com/hi-ogawa/vite-plugins/pull/343))
- feat: preload client assets ([#340](https://github.com/hi-ogawa/vite-plugins/pull/340)), ([#337](https://github.com/hi-ogawa/vite-plugins/pull/337)), ([#331](https://github.com/hi-ogawa/vite-plugins/pull/331))
- fix: tree shake unused references by `__NO_SIDE_EFFECTS__` ([#336](https://github.com/hi-ogawa/vite-plugins/pull/336))

## v0.2.1

- feat: remount subtree on dynamic segment change ([#328](https://github.com/hi-ogawa/vite-plugins/pull/pull/328))

## v0.2.0

- refactor!: extra build step to discover references ([#323](https://github.com/hi-ogawa/vite-plugins/pull/323))

## v0.1.20

- feat: use transforms package for inline server action support ([#320](https://github.com/hi-ogawa/vite-plugins/pull/320))
- fix: noramlize client reference with `?t=` query (hmr timestamp) ([#316](https://github.com/hi-ogawa/vite-plugins/pull/316))
- fix: fix `?import` query dual package when client module is used at both boundary and non-boundary ([#315](https://github.com/hi-ogawa/vite-plugins/pull/315))
- chore(deps): react from 04b058868c-20240508 to 8f3c0525f9-20240521 ([#318](https://github.com/hi-ogawa/vite-plugins/pull/318))
- chore(deps): react 20240508 ([#314](https://github.com/hi-ogawa/vite-plugins/pull/314))

## v0.1.19

- feat: support catch-all dynamic route ([#301](https://github.com/hi-ogawa/vite-plugins/pull/301))
- refactor: organize features ([#299](https://github.com/hi-ogawa/vite-plugins/pull/299))
- chore: update react 20240430 ([#306](https://github.com/hi-ogawa/vite-plugins/pull/306))

## v0.1.18

- feat: support `useActionState` ([#282](https://github.com/hi-ogawa/vite-plugins/pull/282))
- refactor: use official `encodeReply/decodeReply/decodeAction/decodeFormState` ([#282](https://github.com/hi-ogawa/vite-plugins/pull/282))
- refactor: use official `createServerReference` ([#287](https://github.com/hi-ogawa/vite-plugins/pull/287))
- refactor: use official `registerServerReference` ([#286](https://github.com/hi-ogawa/vite-plugins/pull/286))
- refactor: use official `registerClientReference` ([#285](https://github.com/hi-ogawa/vite-plugins/pull/285))
- refactor: replace `ssrLoadModule` with `import` ([#294](https://github.com/hi-ogawa/vite-plugins/pull/294))
- fix: fix server action `const/let` transform ([#290](https://github.com/hi-ogawa/vite-plugins/pull/290))
- fix: preload root js assets ([#277](https://github.com/hi-ogawa/vite-plugins/pull/277))
- chore: react canary 20240408 ([#280](https://github.com/hi-ogawa/vite-plugins/pull/280))

## v0.1.17

- fix: consistent history pathname encoding ([#276](https://github.com/hi-ogawa/vite-plugins/pull/276))
- feat: support `Link.activeProps` ([#276](https://github.com/hi-ogawa/vite-plugins/pull/276))

## v0.1.16

- feat: log unexpected errors ([#273](https://github.com/hi-ogawa/vite-plugins/pull/273))
- fix: decode dynamic route params ([#271](https://github.com/hi-ogawa/vite-plugins/pull/271))

## v0.1.15

- feat: add `LinkForm` ([#270](https://github.com/hi-ogawa/vite-plugins/pull/270))
- feat: add `routerRevalidate` ([#269](https://github.com/hi-ogawa/vite-plugins/pull/269))
- feat: add `ActionContext.revalidate` ([#268](https://github.com/hi-ogawa/vite-plugins/pull/268))
- refactor: layout invalidation on server ([#266](https://github.com/hi-ogawa/vite-plugins/pull/266))
- fix: fix server entry module invalidation ([#264](https://github.com/hi-ogawa/vite-plugins/pull/264))

## v0.1.14

- refactor: use `this: ActionContext` ([#261](https://github.com/hi-ogawa/vite-plugins/pull/261))
- feat: serializable route props ([#262](https://github.com/hi-ogawa/vite-plugins/pull/262))
- fix: fix static route with dynamic sibling ([#260](https://github.com/hi-ogawa/vite-plugins/pull/260))

## v0.1.13

- feat: action return value (implement `useActionData`) ([#255](https://github.com/hi-ogawa/vite-plugins/pull/255))

## v0.1.12

- fix: fix html content-type ([#256](https://github.com/hi-ogawa/vite-plugins/pull/256))

## v0.1.11

- feat: action redirect headers and context ([#254](https://github.com/hi-ogawa/vite-plugins/pull/254))

## v0.1.10

- feat: server action redirect ([#248](https://github.com/hi-ogawa/vite-plugins/pull/248))

## v0.1.9

- fix: remove extra dom from error bounday ([#250](https://github.com/hi-ogawa/vite-plugins/pull/250))
- test: simplify action transition test ([#251](https://github.com/hi-ogawa/vite-plugins/pull/251))

## v0.1.8

- feat: server component redirect ([#243](https://github.com/hi-ogawa/vite-plugins/pull/243))

## v0.1.7

- refactor: simplify layout state ([#249](https://github.com/hi-ogawa/vite-plugins/pull/249))

## v0.1.6

- feat: setup client `optimizeDeps.entries` ([#245](https://github.com/hi-ogawa/vite-plugins/pull/245))
- chore: update react canary 14898b6a9-20240318 ([#209](https://github.com/hi-ogawa/vite-plugins/pull/209))

## v0.1.5

- feat: keep common layout without re-rendering ([#231](https://github.com/hi-ogawa/vite-plugins/pull/231))
- refactor: simplify stream utils ([#240](https://github.com/hi-ogawa/vite-plugins/pull/240))
- refactor: replace rsc-html-stream ([#239](https://github.com/hi-ogawa/vite-plugins/pull/239))
- refactor: organize files by features ([#238](https://github.com/hi-ogawa/vite-plugins/pull/238))

## v0.1.4

- refactor: simplify ssr import cache ([#237](https://github.com/hi-ogawa/vite-plugins/pull/237))
- refactor: simplify error boundary reset ([#233](https://github.com/hi-ogawa/vite-plugins/pull/233))
- refactor: tweak context ([#232](https://github.com/hi-ogawa/vite-plugins/pull/232))
- test: test client render count ([#230](https://github.com/hi-ogawa/vite-plugins/pull/230))
- refactor: organize files ([#229](https://github.com/hi-ogawa/vite-plugins/pull/229))

## v0.1.4-pre.1

- refactor: simplify router store ([#227](https://github.com/hi-ogawa/vite-plugins/pull/227))

## v0.1.3

- feat: router transition state ([#224](https://github.com/hi-ogawa/vite-plugins/pull/224))
- chore: refactor debug ([#228](https://github.com/hi-ogawa/vite-plugins/pull/228))
- test: test `ReactDom.useFormStatus` ([#225](https://github.com/hi-ogawa/vite-plugins/pull/225))

## v0.1.2

- fix: intercept only simple click on `Link` ([#223](https://github.com/hi-ogawa/vite-plugins/pull/223))

## v0.1.1

- fix: silence false warning due to `use client` ([#221](https://github.com/hi-ogawa/vite-plugins/pull/221))

## v0.1.0

- refactor: use self-reference imports ([#219](https://github.com/hi-ogawa/vite-plugins/pull/219))

## v0.1.0-pre.10

- refactor: tweak `PageProps` ([#216](https://github.com/hi-ogawa/vite-plugins/pull/216))

## v0.1.0-pre.9

- feat: client error boundary for server error ([#211](https://github.com/hi-ogawa/vite-plugins/pull/211))
- refactor: simplify self-reference workaround ([#213](https://github.com/hi-ogawa/vite-plugins/pull/213))
- refactor: add `__global` ([#208](https://github.com/hi-ogawa/vite-plugins/pull/208))

## v0.1.0-pre.8

- feat: handle css in react-server ([#205](https://github.com/hi-ogawa/vite-plugins/pull/205))
- refactor: simplify unocss vite integration ([#206](https://github.com/hi-ogawa/vite-plugins/pull/206))

## v0.1.0-pre.6

- feat: render full html via RSC ([#203](https://github.com/hi-ogawa/vite-plugins/pull/203))

## v0.1.0-pre.4

- feat: obfuscate reference id on production ([#201](https://github.com/hi-ogawa/vite-plugins/pull/201))
- feat: custom react server entry ([#199](https://github.com/hi-ogawa/vite-plugins/pull/199))
- refactor: simplify `rscConfig` ([#192](https://github.com/hi-ogawa/vite-plugins/pull/192))
- test: test 3rd party server component library ([#190](https://github.com/hi-ogawa/vite-plugins/pull/190))
- feat: add `RouteProps.request` ([#189](https://github.com/hi-ogawa/vite-plugins/pull/189))
- test: test fresh install ([#188](https://github.com/hi-ogawa/vite-plugins/pull/188))

## v0.1.0-pre.2

- feat: expose external client reference via virtual module during dev ([#187](https://github.com/hi-ogawa/vite-plugins/pull/187))
- refactor: simplify `createDebug` ([#184](https://github.com/hi-ogawa/vite-plugins/pull/184))

## v0.1.0-pre.0

- feat: progressive enhancement ([#183](https://github.com/hi-ogawa/vite-plugins/pull/183))

## v0.0.0

- chore: cleanup debug log ([#181](https://github.com/hi-ogawa/vite-plugins/pull/181))
- chore: use latest in example ([#180](https://github.com/hi-ogawa/vite-plugins/pull/180))

## v0.0.0-pre.4

- feat: create a package ([#178](https://github.com/hi-ogawa/vite-plugins/pull/178))
- feat: server reference in rsc ([#176](https://github.com/hi-ogawa/vite-plugins/pull/176))
- refactor: simplify dev ssr module cache invalidation ([#175](https://github.com/hi-ogawa/vite-plugins/pull/175))
- chore: RSC experiment ([#172](https://github.com/hi-ogawa/vite-plugins/pull/172))
