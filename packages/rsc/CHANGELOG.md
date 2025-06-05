# Changelog

## v0.3.0 (2025-06-05)

- feat!: rsc css code split ([#876](https://github.com/hi-ogawa/vite-plugins/pull/876))
- feat: encrypt closure bind values ([#897](https://github.com/hi-ogawa/vite-plugins/pull/897))
- fix: client element as bound arg encryption ([#905](https://github.com/hi-ogawa/vite-plugins/pull/905))
- fix: throw on client reference call on server ([#900](https://github.com/hi-ogawa/vite-plugins/pull/900))

## v0.2.4 (2025-05-26)

- fix: fix stale css import in non-boundary client module ([#887](https://github.com/hi-ogawa/vite-plugins/pull/887))
- fix: fix non-client-boundary client module hmr in tailwind example ([#886](https://github.com/hi-ogawa/vite-plugins/pull/886))

## v0.2.3 (2025-05-22)

- fix: support Windows ([#884](https://github.com/hi-ogawa/vite-plugins/pull/884))
- fix: remove stale ssr styles during dev ([#879](https://github.com/hi-ogawa/vite-plugins/pull/879))
- fix: add `vary` header to avoid rsc payload on tab re-open ([#877](https://github.com/hi-ogawa/vite-plugins/pull/877))

## v0.2.2 (2025-05-18)

- fix: emit server assets and copy to client ([#861](https://github.com/hi-ogawa/vite-plugins/pull/861))
- fix: css modules hmr ([#860](https://github.com/hi-ogawa/vite-plugins/pull/860))
- fix: fix `collectCssByUrl` error ([#856](https://github.com/hi-ogawa/vite-plugins/pull/856))
- fix: show invalid transform error with code frame ([#871](https://github.com/hi-ogawa/vite-plugins/pull/871))
- perf: preload client reference deps before non-cached import ([#850](https://github.com/hi-ogawa/vite-plugins/pull/850))

## v0.2.1 (2025-05-13)

- feat: automatic client package heuristics ([#830](https://github.com/hi-ogawa/vite-plugins/pull/830))
- fix: add browser entry to  `optimizeDeps.entries` ([#846](https://github.com/hi-ogawa/vite-plugins/pull/846))
- fix: resolve self package from project root ([#845](https://github.com/hi-ogawa/vite-plugins/pull/845))
- refactor: use `rsc-html-stream` ([#843](https://github.com/hi-ogawa/vite-plugins/pull/843))

## v0.2.0 (2025-05-12)

- feat: apply tree-shaking to all client references (2nd approach) ([#838](https://github.com/hi-ogawa/vite-plugins/pull/838))
- feat: support nonce ([#813](https://github.com/hi-ogawa/vite-plugins/pull/813))
- feat: support css in rsc environment ([#825](https://github.com/hi-ogawa/vite-plugins/pull/825))
- feat: support css in client references ([#823](https://github.com/hi-ogawa/vite-plugins/pull/823))
- fix: handle html escape and binary data in ssr rsc payload ([#839](https://github.com/hi-ogawa/vite-plugins/pull/839))
- fix: wrap virtual to workaround module runner entry issues ([#832](https://github.com/hi-ogawa/vite-plugins/pull/832))
- fix: scan build in two environments ([#820](https://github.com/hi-ogawa/vite-plugins/pull/820))
- refactor: simplify client reference mapping ([#836](https://github.com/hi-ogawa/vite-plugins/pull/836))
- refactor!: remove `entries.css` ([#831](https://github.com/hi-ogawa/vite-plugins/pull/831))
- refactor: client reference ssr preinit/preload via proxy and remove `prepareDestination` ([#828](https://github.com/hi-ogawa/vite-plugins/pull/828))
- refactor: tweak asset links api ([#826](https://github.com/hi-ogawa/vite-plugins/pull/826))

## v0.1.1 (2025-05-07)

- fix: statically import client references virtual ([#815](https://github.com/hi-ogawa/vite-plugins/pull/815))
- fix: fix base for findSourceMapURL ([#812](https://github.com/hi-ogawa/vite-plugins/pull/812))
- fix: fix module runner line offset in `findSourceMapURL` ([#810](https://github.com/hi-ogawa/vite-plugins/pull/810))

## v0.1.0 (2025-05-01)

- feat: support `findSourceMapURL` for `createServerReference` ([#796](https://github.com/hi-ogawa/vite-plugins/pull/796))
- feat: support `findSourceMapURL` for component stack and replay logs ([#779](https://github.com/hi-ogawa/vite-plugins/pull/779))
- feat: support temporary references ([#776](https://github.com/hi-ogawa/vite-plugins/pull/776))
- feat: support custom base ([#775](https://github.com/hi-ogawa/vite-plugins/pull/775))
- feat: refactor assets manifest and expose it to rsc build ([#767](https://github.com/hi-ogawa/vite-plugins/pull/767))
- feat: ssr modulepreload only for build ([#763](https://github.com/hi-ogawa/vite-plugins/pull/763))
- feat: tree shake unused reference exports ([#761](https://github.com/hi-ogawa/vite-plugins/pull/761))
- feat: re-export react-server-dom ([#744](https://github.com/hi-ogawa/vite-plugins/pull/744))
- feat: support css entry ([#737](https://github.com/hi-ogawa/vite-plugins/pull/737))
- feat wrap client packages in virtual (support `clientPackages` options) ([#718](https://github.com/hi-ogawa/vite-plugins/pull/718))
- feat: modulepreload client reference on ssr ([#703](https://github.com/hi-ogawa/vite-plugins/pull/703))
- feat: create vite-rsc ([#692](https://github.com/hi-ogawa/vite-plugins/pull/692))
