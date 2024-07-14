# Changelog

## v0.3.3 (2024-07-14)

- fix: fix action `redirect` with `revalidatePath` ([#544](https://github.com/hi-ogawa/vite-plugins/pull/544))
- fix: use ssr `transformRequest` for css crawling on server ([#554](https://github.com/hi-ogawa/vite-plugins/pull/554))
- refactor: use own `useSyncExternalStoreWithSelector` ([#549](https://github.com/hi-ogawa/vite-plugins/pull/549))
- refactor: type `virtual:server-routes` ([#557](https://github.com/hi-ogawa/vite-plugins/pull/557))
- test: add suspense redirect test ([#565](https://github.com/hi-ogawa/vite-plugins/pull/565))
- chore: remove unused deps ([#546](https://github.com/hi-ogawa/vite-plugins/pull/546))

## v0.3.2 (2024-07-11)

- feat: support `useServerInsertedHTML` ([#536](https://github.com/hi-ogawa/vite-plugins/pull/536))
- feat: expose `ReactServerPluginOptions` ([#538](https://github.com/hi-ogawa/vite-plugins/pull/538))
- fix: support higher order server action when js enabled ([#526](https://github.com/hi-ogawa/vite-plugins/pull/526))
- fix: rethrow action error on client ([#531](https://github.com/hi-ogawa/vite-plugins/pull/531))
- fix: don't catch known errors from general ErrorBoundary ([#532](https://github.com/hi-ogawa/vite-plugins/pull/532))
- fix: normalize reference id ([#528](https://github.com/hi-ogawa/vite-plugins/pull/528))
- refactor: skip redundant flight render on action redirect ([#530](https://github.com/hi-ogawa/vite-plugins/pull/530))

## v0.3.1 (2024-07-09)

- feat: route groups + ssr not-found page ([#517](https://github.com/hi-ogawa/vite-plugins/pull/517))
- feat: optional catch-all route ([#518](https://github.com/hi-ogawa/vite-plugins/pull/518))
- refactor!: string only for `RevalidationType` ([#499](https://github.com/hi-ogawa/vite-plugins/pull/499))
- refactor: simplify catchall handling ([#505](https://github.com/hi-ogawa/vite-plugins/pull/505))
- refactor: rename "layout" to "flight" ([#500](https://github.com/hi-ogawa/vite-plugins/pull/500))
- refactor: rework route data structure ([#498](https://github.com/hi-ogawa/vite-plugins/pull/498))
- chore: relax react peer deps + simplify monorepo deps ([#522](https://github.com/hi-ogawa/vite-plugins/pull/522))
- test: test action returning components ([#503](https://github.com/hi-ogawa/vite-plugins/pull/503))

## v0.3.0 (2024-07-04)

- feat!: support `headers`, `cookies` and `revalidatePath` (and remove `useActionContext`) ([#484](https://github.com/hi-ogawa/vite-plugins/pull/484))
- feat!: default entries for browser and server build ([#483](https://github.com/hi-ogawa/vite-plugins/pull/483))
- feat: api routes ([#482](https://github.com/hi-ogawa/vite-plugins/pull/482))
- fix: fix server-only and client-only ([#480](https://github.com/hi-ogawa/vite-plugins/pull/480))
- fix: prerender html without suspsense fallback ([#479](https://github.com/hi-ogawa/vite-plugins/pull/479))
- fix: fix late deps optimization on local dev ([#493](https://github.com/hi-ogawa/vite-plugins/pull/493))
- refactor: simplify `PrerenderManifest` typings ([#476](https://github.com/hi-ogawa/vite-plugins/pull/476))
- refactor!: rename `server -> ssr`, `react-server -> server`, `client -> browser` ([#486](https://github.com/hi-ogawa/vite-plugins/pull/486))

## v0.2.10 (2024-07-01)

- feat: add prerender presets ([#471](https://github.com/hi-ogawa/vite-plugins/pull/471))
- feat: expose route modules for prerender ([#465](https://github.com/hi-ogawa/vite-plugins/pull/465))
- fix: copy all server assets to browser build ([#469](https://github.com/hi-ogawa/vite-plugins/pull/469))
- feat: add `PageProps.searchParams` ([#468](https://github.com/hi-ogawa/vite-plugins/pull/468))

## v0.2.9 (2024-06-30)

- feat: add `useLocation` to provide server url ([#463](https://github.com/hi-ogawa/vite-plugins/pull/463))
- feat: add default meta viewport ([#462](https://github.com/hi-ogawa/vite-plugins/pull/462))
- feat: loading and template file convention ([#456](https://github.com/hi-ogawa/vite-plugins/pull/456))
- feat: not-found file convention ([#454](https://github.com/hi-ogawa/vite-plugins/pull/454))
- feat: add hooks to provide current route params ([#453](https://github.com/hi-ogawa/vite-plugins/pull/453))
- perf: emit route manifest as a separate asset ([#460](https://github.com/hi-ogawa/vite-plugins/pull/460))
- refactor: simplify ssr flight stream ([#458](https://github.com/hi-ogawa/vite-plugins/pull/458))
- chore: tweak default error page ([#461](https://github.com/hi-ogawa/vite-plugins/pull/461))

## v0.2.8 (2024-06-27)

- feat: support `metadata` export ([#449](https://github.com/hi-ogawa/vite-plugins/pull/449))

## v0.2.7 (2024-06-27)

- feat: support non esm project ([#414](https://github.com/hi-ogawa/vite-plugins/pull/414))
- perf: set `build.write: false` during scan ([#445](https://github.com/hi-ogawa/vite-plugins/pull/445))

## v0.2.6 (2024-06-26)

- feat: validate server-only and client-only ([#433](https://github.com/hi-ogawa/vite-plugins/pull/433))
- fix: fix initial server css crawling ([#425](https://github.com/hi-ogawa/vite-plugins/pull/425))
- fix: robust server reference build scan ([#431](https://github.com/hi-ogawa/vite-plugins/pull/431))
- fix: assert discovered server reference during build ([#430](https://github.com/hi-ogawa/vite-plugins/pull/430))
- fix: avoid ssr build on browser build failure ([#429](https://github.com/hi-ogawa/vite-plugins/pull/429))

## v0.2.5 (2024-06-25)

- feat(next): create alias package ([#418](https://github.com/hi-ogawa/vite-plugins/pull/418))
- feat(next): compat link and navigation ([#420](https://github.com/hi-ogawa/vite-plugins/pull/420)), ([#421](https://github.com/hi-ogawa/vite-plugins/pull/421))

## v0.2.4 (2024-06-25)

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

## v0.2.3 (2024-06-07)

- fix: merge Link props handlers ([#368](https://github.com/hi-ogawa/vite-plugins/pull/368))

## v0.2.2 (2024-06-07)

- refactor: encode stream request metadata in http header ([#363](https://github.com/hi-ogawa/vite-plugins/pull/363))
- feat: prerender ([#357](https://github.com/hi-ogawa/vite-plugins/pull/357))
- refactor: simplify stream request convention (rebased) ([#361](https://github.com/hi-ogawa/vite-plugins/pull/361))
- fix: fix client css module hmr ([#346](https://github.com/hi-ogawa/vite-plugins/pull/346))
- fix: fix client css FOUC ([#342](https://github.com/hi-ogawa/vite-plugins/pull/342))
- feat: preload css ([#341](https://github.com/hi-ogawa/vite-plugins/pull/341))
- chore(deps): update react v19.0.0-rc.0 ([#343](https://github.com/hi-ogawa/vite-plugins/pull/343))
- feat: preload client assets ([#340](https://github.com/hi-ogawa/vite-plugins/pull/340)), ([#337](https://github.com/hi-ogawa/vite-plugins/pull/337)), ([#331](https://github.com/hi-ogawa/vite-plugins/pull/331))
- fix: tree shake unused references by `__NO_SIDE_EFFECTS__` ([#336](https://github.com/hi-ogawa/vite-plugins/pull/336))

## v0.2.1 (2024-06-01)

- feat: remount subtree on dynamic segment change ([#328](https://github.com/hi-ogawa/vite-plugins/pull/pull/328))

## v0.2.0 (2024-05-30)

- refactor!: extra build step to discover references ([#323](https://github.com/hi-ogawa/vite-plugins/pull/323))

## v0.1.20 (2024-05-29)

- feat: use transforms package for inline server action support ([#320](https://github.com/hi-ogawa/vite-plugins/pull/320))
- fix: noramlize client reference with `?t=` query (hmr timestamp) ([#316](https://github.com/hi-ogawa/vite-plugins/pull/316))
- fix: fix `?import` query dual package when client module is used at both boundary and non-boundary ([#315](https://github.com/hi-ogawa/vite-plugins/pull/315))
- chore(deps): react from 04b058868c-20240508 to 8f3c0525f9-20240521 ([#318](https://github.com/hi-ogawa/vite-plugins/pull/318))
- chore(deps): react 20240508 ([#314](https://github.com/hi-ogawa/vite-plugins/pull/314))

## v0.1.19 (2024-05-02)

- feat: support catch-all dynamic route ([#301](https://github.com/hi-ogawa/vite-plugins/pull/301))
- refactor: organize features ([#299](https://github.com/hi-ogawa/vite-plugins/pull/299))
- chore: update react 20240430 ([#306](https://github.com/hi-ogawa/vite-plugins/pull/306))

## v0.1.18 (2024-04-20)

- feat: support `useActionState` ([#282](https://github.com/hi-ogawa/vite-plugins/pull/282))
- refactor: use official `encodeReply/decodeReply/decodeAction/decodeFormState` ([#282](https://github.com/hi-ogawa/vite-plugins/pull/282))
- refactor: use official `createServerReference` ([#287](https://github.com/hi-ogawa/vite-plugins/pull/287))
- refactor: use official `registerServerReference` ([#286](https://github.com/hi-ogawa/vite-plugins/pull/286))
- refactor: use official `registerClientReference` ([#285](https://github.com/hi-ogawa/vite-plugins/pull/285))
- refactor: replace `ssrLoadModule` with `import` ([#294](https://github.com/hi-ogawa/vite-plugins/pull/294))
- fix: fix server action `const/let` transform ([#290](https://github.com/hi-ogawa/vite-plugins/pull/290))
- fix: preload root js assets ([#277](https://github.com/hi-ogawa/vite-plugins/pull/277))
- chore: react canary 20240408 ([#280](https://github.com/hi-ogawa/vite-plugins/pull/280))

## v0.1.17 (2024-04-08)

- fix: consistent history pathname encoding ([#276](https://github.com/hi-ogawa/vite-plugins/pull/276))
- feat: support `Link.activeProps` ([#276](https://github.com/hi-ogawa/vite-plugins/pull/276))

## v0.1.16 (2024-04-08)

- feat: log unexpected errors ([#273](https://github.com/hi-ogawa/vite-plugins/pull/273))
- fix: decode dynamic route params ([#271](https://github.com/hi-ogawa/vite-plugins/pull/271))

## v0.1.15 (2024-04-07)

- feat: add `LinkForm` ([#270](https://github.com/hi-ogawa/vite-plugins/pull/270))
- feat: add `routerRevalidate` ([#269](https://github.com/hi-ogawa/vite-plugins/pull/269))
- feat: add `ActionContext.revalidate` ([#268](https://github.com/hi-ogawa/vite-plugins/pull/268))
- refactor: layout invalidation on server ([#266](https://github.com/hi-ogawa/vite-plugins/pull/266))
- fix: fix server entry module invalidation ([#264](https://github.com/hi-ogawa/vite-plugins/pull/264))

## v0.1.14 (2024-04-05)

- refactor: use `this: ActionContext` ([#261](https://github.com/hi-ogawa/vite-plugins/pull/261))
- feat: serializable route props ([#262](https://github.com/hi-ogawa/vite-plugins/pull/262))
- fix: fix static route with dynamic sibling ([#260](https://github.com/hi-ogawa/vite-plugins/pull/260))

## v0.1.13 (2024-04-05)

- feat: action return value (implement `useActionData`) ([#255](https://github.com/hi-ogawa/vite-plugins/pull/255))

## v0.1.12 (2024-04-02)

- fix: fix html content-type ([#256](https://github.com/hi-ogawa/vite-plugins/pull/256))

## v0.1.11 (2024-04-02)

- feat: action redirect headers and context ([#254](https://github.com/hi-ogawa/vite-plugins/pull/254))

## v0.1.10 (2024-04-02)

- feat: server action redirect ([#248](https://github.com/hi-ogawa/vite-plugins/pull/248))

## v0.1.9 (2024-04-02)

- fix: remove extra dom from error bounday ([#250](https://github.com/hi-ogawa/vite-plugins/pull/250))
- test: simplify action transition test ([#251](https://github.com/hi-ogawa/vite-plugins/pull/251))

## v0.1.8 (2024-04-02)

- feat: server component redirect ([#243](https://github.com/hi-ogawa/vite-plugins/pull/243))

## v0.1.7 (2024-04-02)

- refactor: simplify layout state ([#249](https://github.com/hi-ogawa/vite-plugins/pull/249))

## v0.1.6 (2024-04-01)

- feat: setup client `optimizeDeps.entries` ([#245](https://github.com/hi-ogawa/vite-plugins/pull/245))
- chore: update react canary 14898b6a9-20240318 ([#209](https://github.com/hi-ogawa/vite-plugins/pull/209))

## v0.1.5 (2024-04-01)

- feat: keep common layout without re-rendering ([#231](https://github.com/hi-ogawa/vite-plugins/pull/231))
- refactor: simplify stream utils ([#240](https://github.com/hi-ogawa/vite-plugins/pull/240))
- refactor: replace rsc-html-stream ([#239](https://github.com/hi-ogawa/vite-plugins/pull/239))
- refactor: organize files by features ([#238](https://github.com/hi-ogawa/vite-plugins/pull/238))

## v0.1.4 (2024-03-30)

- refactor: simplify ssr import cache ([#237](https://github.com/hi-ogawa/vite-plugins/pull/237))
- refactor: simplify error boundary reset ([#233](https://github.com/hi-ogawa/vite-plugins/pull/233))
- refactor: tweak context ([#232](https://github.com/hi-ogawa/vite-plugins/pull/232))
- test: test client render count ([#230](https://github.com/hi-ogawa/vite-plugins/pull/230))
- refactor: organize files ([#229](https://github.com/hi-ogawa/vite-plugins/pull/229))

## v0.1.4-pre.1 (2024-03-25)

- refactor: simplify router store ([#227](https://github.com/hi-ogawa/vite-plugins/pull/227))

## v0.1.3 (2024-03-25)

- feat: router transition state ([#224](https://github.com/hi-ogawa/vite-plugins/pull/224))
- chore: refactor debug ([#228](https://github.com/hi-ogawa/vite-plugins/pull/228))
- test: test `ReactDom.useFormStatus` ([#225](https://github.com/hi-ogawa/vite-plugins/pull/225))

## v0.1.2 (2024-03-23)

- fix: intercept only simple click on `Link` ([#223](https://github.com/hi-ogawa/vite-plugins/pull/223))

## v0.1.1 (2024-03-23)

- fix: silence false warning due to `use client` ([#221](https://github.com/hi-ogawa/vite-plugins/pull/221))

## v0.1.0 (2024-03-23)

- refactor: use self-reference imports ([#219](https://github.com/hi-ogawa/vite-plugins/pull/219))

## v0.1.0-pre.10 (2024-03-22)

- refactor: tweak `PageProps` ([#216](https://github.com/hi-ogawa/vite-plugins/pull/216))

## v0.1.0-pre.9 (2024-03-22)

- feat: client error boundary for server error ([#211](https://github.com/hi-ogawa/vite-plugins/pull/211))
- refactor: simplify self-reference workaround ([#213](https://github.com/hi-ogawa/vite-plugins/pull/213))
- refactor: add `__global` ([#208](https://github.com/hi-ogawa/vite-plugins/pull/208))

## v0.1.0-pre.8 (2024-03-19)

- feat: handle css in react-server ([#205](https://github.com/hi-ogawa/vite-plugins/pull/205))
- refactor: simplify unocss vite integration ([#206](https://github.com/hi-ogawa/vite-plugins/pull/206))

## v0.1.0-pre.6 (2024-03-18)

- feat: render full html via RSC ([#203](https://github.com/hi-ogawa/vite-plugins/pull/203))

## v0.1.0-pre.4 (2024-03-17)

- feat: obfuscate reference id on production ([#201](https://github.com/hi-ogawa/vite-plugins/pull/201))
- feat: custom react server entry ([#199](https://github.com/hi-ogawa/vite-plugins/pull/199))
- refactor: simplify `rscConfig` ([#192](https://github.com/hi-ogawa/vite-plugins/pull/192))
- test: test 3rd party server component library ([#190](https://github.com/hi-ogawa/vite-plugins/pull/190))
- feat: add `RouteProps.request` ([#189](https://github.com/hi-ogawa/vite-plugins/pull/189))
- test: test fresh install ([#188](https://github.com/hi-ogawa/vite-plugins/pull/188))

## v0.1.0-pre.2 (2024-03-15)

- feat: expose external client reference via virtual module during dev ([#187](https://github.com/hi-ogawa/vite-plugins/pull/187))
- refactor: simplify `createDebug` ([#184](https://github.com/hi-ogawa/vite-plugins/pull/184))

## v0.1.0-pre.0 (2024-03-15)

- feat: progressive enhancement ([#183](https://github.com/hi-ogawa/vite-plugins/pull/183))

## v0.0.0 (2024-03-14)

- chore: cleanup debug log ([#181](https://github.com/hi-ogawa/vite-plugins/pull/181))
- chore: use latest in example ([#180](https://github.com/hi-ogawa/vite-plugins/pull/180))

## v0.0.0-pre.4 (2024-03-14)

- feat: create a package ([#178](https://github.com/hi-ogawa/vite-plugins/pull/178))
- feat: server reference in rsc ([#176](https://github.com/hi-ogawa/vite-plugins/pull/176))
- refactor: simplify dev ssr module cache invalidation ([#175](https://github.com/hi-ogawa/vite-plugins/pull/175))
- chore: RSC experiment ([#172](https://github.com/hi-ogawa/vite-plugins/pull/172))
