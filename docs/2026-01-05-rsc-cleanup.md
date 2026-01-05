# RSC Packages Cleanup

## Summary

Removed the following packages from this repository:

- **`packages/rsc`** - Now maintained as Vite's official package [`@vitejs/plugin-rsc`](https://github.com/vitejs/vite-plugin-react/tree/main/packages/plugin-rsc)
- **`packages/rsc-react-router`** - Now officially supported by React Router team at https://reactrouter.com/how-to/react-server-components

## react-server Migration to @vitejs/plugin-rsc

`packages/react-server` can be migrated to use `@vitejs/plugin-rsc` with the following changes:

### Import Path Mappings

| @hiogawa/vite-rsc | @vitejs/plugin-rsc |
|---|---|
| `/react/browser` | `/browser` |
| `/react/rsc` | `/rsc` |
| `/react/ssr` | `/ssr` |
| `/core/plugin` (default export) | main export |

### Files Requiring Updates (11 files)

| File | Current Import |
|------|---------------|
| `src/entry/browser.tsx` | `@hiogawa/vite-rsc/react/browser` |
| `src/entry/server.tsx` | `@hiogawa/vite-rsc/react/rsc` |
| `src/entry/ssr.tsx` | `@hiogawa/vite-rsc/react/ssr` |
| `src/features/client-component/browser.tsx` | `@hiogawa/vite-rsc/react/browser` |
| `src/features/client-component/server.tsx` | `@hiogawa/vite-rsc/react/rsc` |
| `src/features/client-component/ssr.tsx` | `@hiogawa/vite-rsc/react/ssr` |
| `src/features/client-component/plugin.ts` | `@hiogawa/vite-rsc/vite-utils` |
| `src/features/server-action/browser.tsx` | `@hiogawa/vite-rsc/react/browser` |
| `src/features/server-action/server.tsx` | `@hiogawa/vite-rsc/react/rsc` |
| `src/features/server-action/ssr.tsx` | `@hiogawa/vite-rsc/react/ssr` |
| `src/plugin/index.ts` | `@hiogawa/vite-rsc/core/plugin`, `@hiogawa/vite-rsc/plugin` |

### Utility Functions Not Exported by @vitejs/plugin-rsc

These need to be copied into react-server or alternative implementations found:

#### 1. `vitePluginFindSourceMapURL` (~60 lines)

- **Source**: `packages/rsc/src/plugin.ts:1315-1375`
- **Purpose**: Provides source map URLs for React's error overlay
- **Used at**: `packages/react-server/src/plugin/index.ts:332`

```typescript
export function vitePluginFindSourceMapURL(): Plugin[] {
  return [
    {
      name: "rsc:findSourceMapURL",
      apply: "serve",
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          const url = new URL(req.url!, `http://localhost`);
          if (url.pathname === "/__vite_rsc_findSourceMapURL") {
            // ... handle source map URL lookup
          }
          next();
        });
      },
    },
  ];
}
```

#### 2. `normalizeViteImportAnalysisUrl` (~15 lines + dependencies ~100 lines)

- **Source**: `packages/rsc/src/vite-utils.ts`
- **Purpose**: Normalizes client reference IDs to match Vite's import analysis
- **Used at**: `packages/react-server/src/features/client-component/plugin.ts:121`

This function depends on several helper utilities from the same file:
- `VALID_ID_PREFIX`, `NULL_BYTE_PLACEHOLDER`, `FS_PREFIX`
- `wrapId`, `unwrapId`, `withTrailingSlash`, `cleanUrl`
- `splitFileAndPostfix`, `slash`, `injectQuery`, `joinUrlSegments`
- `normalizeResolvedIdToUrl`

### React Runtime APIs (Should Be Compatible)

These are re-exports from react-server-dom and should work the same:

- `renderToReadableStream`, `createFromReadableStream`
- `decodeReply`, `loadServerAction`, `decodeAction`, `decodeFormState`
- `encodeReply`, `createFromFetch`, `setServerCallback`
- `setRequireModule`, `registerClientReference`, `registerServerReference`
