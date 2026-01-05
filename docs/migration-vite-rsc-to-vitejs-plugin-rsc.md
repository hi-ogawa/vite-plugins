# Migration Plan: @hiogawa/vite-rsc → @vitejs/plugin-rsc

## Status: In Progress

This document tracks the migration of `@hiogawa/react-server` from `@hiogawa/vite-rsc` to `@vitejs/plugin-rsc`.

## Completed Changes

### 1. Dependency Update
- Replaced `@hiogawa/vite-rsc@^0.4.9` with `@vitejs/plugin-rsc@^0.5.9`

### 2. Import Path Updates

| Old Path | New Path |
|----------|----------|
| `@hiogawa/vite-rsc/react/rsc` | `@vitejs/plugin-rsc/rsc` |
| `@hiogawa/vite-rsc/react/ssr` | `@vitejs/plugin-rsc/ssr` |
| `@hiogawa/vite-rsc/react/browser` | `@vitejs/plugin-rsc/browser` |
| `@hiogawa/vite-rsc/core/plugin` | `@vitejs/plugin-rsc` (default export) |

### 3. Removed Custom Transform Plugins

The following plugins were removed since `@vitejs/plugin-rsc` handles transforms:
- `vitePluginServerUseClient` - "use client" transform in RSC env
- `vitePluginServerUseServer` - "use server" transform in RSC env
- `vitePluginClientUseClient` - client reference handling
- `vitePluginClientUseServer` - "use server" transform in client env

### 4. Removed Manual Initialization

`@vitejs/plugin-rsc` auto-initializes `setRequireModule` when imported:
- Removed `initializeReactServer()` from `entry/server.tsx`
- Removed `initializeReactClientSsr()` from `entry/ssr.tsx`
- Removed `initializeReactClientBrowser()` from `entry/browser.tsx`
- Simplified `features/client-component/*.tsx` and `features/server-action/*.tsx`

### 5. Simplified PluginStateManager

Removed unused properties:
- `clientReferenceMap` - was populated by removed transform plugins
- `serverReferenceMap` - was populated by removed transform plugins
- `nodeModules.useClient` - was used for node_modules client references
- `serverIds` - was used for HMR tracking
- `shouldReloadRsc()` - depended on removed maps
- `normalizeReferenceId()` - was used by transform plugins
- `prepareDestinationManifest` - was used for client reference preloading

### 6. Dropped Client Reference Preloading

Native RSC doesn't support client reference preloading. Removed:
- `prepareDestinationManifest` generation in `router/plugin.ts`
- Client reference CSS collection in `assets/plugin.ts`

TODO: https://github.com/wakujs/waku/issues/1656

### 7. Simplified HMR Logic

Removed custom RSC HMR event sending since `@vitejs/plugin-rsc` handles `rsc:update` events.

---

### 8. Removed Framework Plugins Now Handled by @vitejs/plugin-rsc

The following framework plugins were removed since `@vitejs/plugin-rsc` handles their functionality:

| Plugin | Reason |
|--------|--------|
| `rscParentPlugin` | RSC environment setup handled by plugin (replaced with `frameworkConfigPlugin`) |
| `buildOrchestrationPlugin` | Build orchestration handled by plugin |
| `inject-async-local-storage` | Async local storage injection handled by plugin |
| `validateImportPlugin` | Import validation handled by plugin |
| `serverDepsConfigPlugin()` | Server deps config handled by plugin |
| `serverAssetsPluginServer` | Server assets handling handled by plugin |
| `virtual:react-server-build` | Replaced with `import.meta.viteRsc.loadModule("rsc", "index")` |

### 9. Deleted Plugin Files

- `packages/react-server/src/features/client-component/plugin.ts`
- `packages/react-server/src/features/server-action/plugin.tsx`

### 10. Updated Build Phase Detection

Replaced `manager.buildType` checks with `this.environment.name` checks:
- `router/plugin.ts` - uses `this.environment.name === "rsc"`, `"client"`, `"ssr"`
- `prerender/plugin.ts` - uses `this.environment.name === "ssr"`
- `assets/plugin.ts` - uses `this.environment?.mode === "dev"`

---

## Remaining Work

### E2E Testing Required

E2E tests need to verify:
- Dev server works
- Production build works
- HMR works (both server and client components)
- Server actions work
- SSR streaming works
- File-based routing works

---

## Architecture Comparison

### Before (with @hiogawa/vite-rsc)

```
@hiogawa/react-server
├── Plugin layer
│   ├── rscCore() from vite-rsc - core RSC environment
│   ├── vitePluginFindSourceMapURL() - error overlay
│   ├── vitePluginServerUseClient - "use client" transform
│   ├── vitePluginServerUseServer - "use server" transform
│   ├── vitePluginClientUseClient - client reference virtual module
│   ├── vitePluginClientUseServer - "use server" in client
│   ├── buildOrchestrationPlugin - 4-phase build
│   └── Framework plugins (router, prerender, assets, etc.)
├── Entry points
│   ├── Manual setRequireModule initialization
│   └── Framework-specific routing/rendering
└── Framework features
    └── File-based routing, metadata, error handling, etc.
```

### After (with @vitejs/plugin-rsc)

```
@hiogawa/react-server
├── Plugin layer
│   ├── rsc() from @vitejs/plugin-rsc - handles ALL RSC bundling
│   ├── frameworkConfigPlugin - framework-specific config (outDir, entries)
│   └── Framework plugins (router, prerender, assets, etc.)
├── Entry points
│   ├── Auto-initialized by plugin imports
│   ├── import.meta.viteRsc.loadModule for cross-environment imports
│   └── Framework-specific routing/rendering
└── Framework features
    └── File-based routing, metadata, error handling, etc.
```

---

## Reference

- `@vitejs/plugin-rsc` source: `/home/hiroshi/code/others/vite-plugin-react/packages/plugin-rsc`
- Starter example: `/home/hiroshi/code/others/vite-plugin-react/packages/plugin-rsc/examples/starter`
- SSG/Prerender example: `/home/hiroshi/code/others/vite-plugin-react/packages/plugin-rsc/examples/ssg`
- Plugin API: `getPluginApi(config)` returns `{ manager: RscPluginManager }`
