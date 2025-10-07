# Changelog

## v0.0.1 (2025-10-07)

- fix: avoid `addWatchFile` for virtual invalidation ([#1239](https://github.com/hi-ogawa/vite-plugins/pull/1239))
- fix: skip assets module itself for css collection ([#1240](https://github.com/hi-ogawa/vite-plugins/pull/1240))
- fix: fix `?assets` dts typing ([#1236](https://github.com/hi-ogawa/vite-plugins/pull/1236))
- fix: use `preserveSignature: exports-only` for client assets entry ([#1234](https://github.com/hi-ogawa/vite-plugins/pull/1234))
- fix: ensure module is analyzed during `collectCss` ([#1227](https://github.com/hi-ogawa/vite-plugins/pull/1227))
- fix: remove `?assets` import chunk from client build ([#1221](https://github.com/hi-ogawa/vite-plugins/pull/1221))
- fix: rename options ([#1229](https://github.com/hi-ogawa/vite-plugins/pull/1229))
- refactor: simplify assets import virual ([#1238](https://github.com/hi-ogawa/vite-plugins/pull/1238))
- chore: data fetching example ([#1242](https://github.com/hi-ogawa/vite-plugins/pull/1242))
- chore: island example ([#1225](https://github.com/hi-ogawa/vite-plugins/pull/1225))
- chore: tweak vue-router example ([#1223](https://github.com/hi-ogawa/vite-plugins/pull/1223))
- test: add `import.meta.glob` example ([#1224](https://github.com/hi-ogawa/vite-plugins/pull/1224))

## v0.0.0 (2025-10-05)

- docs: tweak heading ([#1218](https://github.com/hi-ogawa/vite-plugins/pull/1218))

## v0.0.0-alpha.3 (2025-10-04)

- feat: support `?assets=client` and `?assets=ssr` ([#1214](https://github.com/hi-ogawa/vite-plugins/pull/1214))
- feat: support `?assets` query ([#1208](https://github.com/hi-ogawa/vite-plugins/pull/1208))
- fix: remove `transformeRequest` during `collectCss` ([#1212](https://github.com/hi-ogawa/vite-plugins/pull/1212))
- docs: `?assets` import ([#1215](https://github.com/hi-ogawa/vite-plugins/pull/1215))
- chore: use unhead to simplify vue-router ([#1216](https://github.com/hi-ogawa/vite-plugins/pull/1216))
- chore: simplify vue-router ssr head example ([#1210](https://github.com/hi-ogawa/vite-plugins/pull/1210))
- chore: simplify react-router ssr head example ([#1209](https://github.com/hi-ogawa/vite-plugins/pull/1209))
- chore: tweak vue-router example ([#1205](https://github.com/hi-ogawa/vite-plugins/pull/1205))

## v0.0.0-alpha.2 (2025-10-04)

- feat!: universal route assets as default ([#1196](https://github.com/hi-ogawa/vite-plugins/pull/1196))
- fix: merge `asEntry` properly ([#1200](https://github.com/hi-ogawa/vite-plugins/pull/1200))
- fix: ensure watch file for import with queries ([#1197](https://github.com/hi-ogawa/vite-plugins/pull/1197))
- fix: remove client-fallback from output ([#1198](https://github.com/hi-ogawa/vite-plugins/pull/1198))
- fix: avoid `addWatchFile` for assets virtual ([#1194](https://github.com/hi-ogawa/vite-plugins/pull/1194))
- fix: enable `emitAssets` by default ([#1186](https://github.com/hi-ogawa/vite-plugins/pull/1186))
- docs: typo ([#1195](https://github.com/hi-ogawa/vite-plugins/pull/1195))
- test: test react-router ([#1188](https://github.com/hi-ogawa/vite-plugins/pull/1188))
- test: test vue-router ([#1187](https://github.com/hi-ogawa/vite-plugins/pull/1187))
- chore: tweak vue-router example ([#1202](https://github.com/hi-ogawa/vite-plugins/pull/1202))
- chore: move `reactHmrPreamblePlugin` to each example ([#1201](https://github.com/hi-ogawa/vite-plugins/pull/1201))
- chore: add ssg example ([#1184](https://github.com/hi-ogawa/vite-plugins/pull/1184))

## v0.0.0-alpha.1 (2025-10-03)

- fix: fix `asEntry` option ([#1174](https://github.com/hi-ogawa/vite-plugins/pull/1174))
- fix: enable `emitAssets` by default ([#1176](https://github.com/hi-ogawa/vite-plugins/pull/1176))
- chore: remove `universal` option ([#1181](https://github.com/hi-ogawa/vite-plugins/pull/1181))
- chore: standalone examples ([#1180](https://github.com/hi-ogawa/vite-plugins/pull/1180))
- test: cloudflare plugin ([#1177](https://github.com/hi-ogawa/vite-plugins/pull/1177))
- test: more e2e ([#1173](https://github.com/hi-ogawa/vite-plugins/pull/1173))

## v0.0.0-alpha.0 (2025-10-02)

- prototype `import.meta.vite.assets` API ([#1168](https://github.com/hi-ogawa/vite-plugins/pull/1168))
