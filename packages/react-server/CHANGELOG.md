# Changelog

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
