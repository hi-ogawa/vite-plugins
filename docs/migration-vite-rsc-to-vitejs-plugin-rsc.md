# Migration Plan: @hiogawa/vite-rsc → @vitejs/plugin-rsc

## Overview

Migrate `@hiogawa/react-server` to fully leverage `@vitejs/plugin-rsc` as the complete RSC bundler layer. This is an "all-in" migration - the plugin provides the entire RSC bundler feature set, and `@hiogawa/react-server` becomes a thin framework layer on top.

### Reference Implementation

See the minimal starter example:
```
/home/hiroshi/code/others/vite-plugin-react/packages/plugin-rsc/examples/starter/src/framework/
├── entry.browser.tsx  # ~140 lines - hydration, navigation, server callback
├── entry.rsc.tsx      # ~120 lines - RSC rendering, action handling
├── entry.ssr.tsx      # ~75 lines  - HTML streaming
├── error-boundary.tsx # Error boundary component
└── request.tsx        # Request routing conventions
```

---

## What @vitejs/plugin-rsc Provides

### Build-time (Plugin)

| Feature | API |
|---------|-----|
| `"use client"` transform | Automatic client reference generation |
| `"use server"` transform | Automatic server reference generation |
| CSS code-splitting | Auto-inject or `import.meta.viteRsc.loadCss()` |
| Multi-environment build | Orchestrates rsc → client → ssr builds |
| Asset manifests | Client reference deps, server resources |
| Import validation | `server-only` / `client-only` checks |

### Runtime Helpers

| Helper | Environment | Purpose |
|--------|-------------|---------|
| `import.meta.viteRsc.loadModule()` | rsc | Load SSR module from RSC env |
| `import.meta.viteRsc.loadBootstrapScriptContent()` | ssr | Get client bootstrap JS |
| `import.meta.viteRsc.loadCss()` | rsc | Collect CSS for current module |
| `import.meta.hot.on('rsc:update', ...)` | browser | Server HMR trigger |

### Runtime APIs

**`@vitejs/plugin-rsc/rsc`:**
- `renderToReadableStream`, `createFromReadableStream`
- `registerClientReference`, `registerServerReference`
- `loadServerAction`, `decodeReply`, `decodeAction`, `decodeFormState`
- `createTemporaryReferenceSet`, `encodeReply`

**`@vitejs/plugin-rsc/ssr`:**
- `createFromReadableStream`
- `createServerConsumerManifest`

**`@vitejs/plugin-rsc/browser`:**
- `createFromReadableStream`, `createFromFetch`
- `setServerCallback`, `createServerReference`
- `createTemporaryReferenceSet`, `encodeReply`
- `findSourceMapURL`

---

## What @hiogawa/react-server Keeps

These are framework-specific features not provided by the plugin:

| Feature | Directory | Description |
|---------|-----------|-------------|
| File-based routing | `src/features/router/` | Route discovery, tree building, manifest |
| Metadata handling | `src/features/meta/` | `<head>` management |
| Error handling | `src/features/error/` | Error boundaries, not-found |
| Request context | `src/features/request-context/` | AsyncLocalStorage, cookies, headers |
| Prerender | `src/features/prerender/` | Static generation |
| Next.js compat | `src/features/next/` | NextRequest/NextResponse APIs |
| Assets | `src/features/assets/` | Route-based asset injection |

---

## What @hiogawa/react-server Removes

### Plugins (Replaced by @vitejs/plugin-rsc)

| File | Reason |
|------|--------|
| `src/features/client-component/plugin.ts` | Plugin handles `"use client"` transforms |
| `src/features/server-action/plugin.tsx` | Plugin handles `"use server"` transforms |

### Utilities (No Longer Needed)

| Utility | Reason |
|---------|--------|
| `normalizeViteImportAnalysisUrl` | Plugin's transform handles client IDs |
| `vitePluginFindSourceMapURL` | Use `findSourceMapURL` from `/browser` |

### Core Plugin Setup

The entire RSC environment setup from `@hiogawa/vite-rsc/core/plugin` is replaced by:

```typescript
import rsc from '@vitejs/plugin-rsc'

export default defineConfig({
  plugins: [rsc()],
  environments: {
    rsc: { build: { rollupOptions: { input: { index: './entry.rsc.tsx' } } } },
    ssr: { build: { rollupOptions: { input: { index: './entry.ssr.tsx' } } } },
    client: { build: { rollupOptions: { input: { index: './entry.browser.tsx' } } } },
  },
})
```

---

## Entry Point Rewrites

### entry.rsc.tsx (Server)

**Before:** Complex integration with vite-rsc internals
**After:** Minimal API usage

```typescript
import {
  renderToReadableStream,
  createTemporaryReferenceSet,
  decodeReply,
  loadServerAction,
  decodeAction,
  decodeFormState,
} from '@vitejs/plugin-rsc/rsc'

export default async function handler(request: Request): Promise<Response> {
  // Handle server actions...
  // Render RSC stream
  const rscStream = renderToReadableStream(payload)

  // For SSR: delegate to SSR environment
  const ssrEntry = await import.meta.viteRsc.loadModule<...>('ssr', 'index')
  const html = await ssrEntry.renderHTML(rscStream)
  return new Response(html)
}
```

### entry.ssr.tsx (SSR)

```typescript
import { createFromReadableStream } from '@vitejs/plugin-rsc/ssr'
import { renderToReadableStream } from 'react-dom/server.edge'
import { injectRSCPayload } from 'rsc-html-stream/server'

export async function renderHTML(rscStream: ReadableStream) {
  const [rscStream1, rscStream2] = rscStream.tee()

  // Deserialize RSC → React VDOM
  const payload = createFromReadableStream(rscStream1)

  // Get bootstrap script
  const bootstrapScriptContent = await import.meta.viteRsc.loadBootstrapScriptContent('index')

  // Render HTML
  const htmlStream = await renderToReadableStream(<Root />, { bootstrapScriptContent })

  // Inject RSC payload for hydration
  return htmlStream.pipeThrough(injectRSCPayload(rscStream2))
}
```

### entry.browser.tsx (Client)

```typescript
import {
  createFromReadableStream,
  createFromFetch,
  setServerCallback,
  createTemporaryReferenceSet,
  encodeReply,
} from '@vitejs/plugin-rsc/browser'
import { rscStream } from 'rsc-html-stream/client'

// Hydrate from initial RSC payload
const initialPayload = await createFromReadableStream(rscStream)
hydrateRoot(document, <Root />)

// Server action callback
setServerCallback(async (id, args) => {
  const body = await encodeReply(args, { temporaryReferences })
  const payload = await createFromFetch(fetch(actionRequest))
  // Re-render...
})

// Server HMR
import.meta.hot?.on('rsc:update', () => refetch())
```

---

## Plugin Configuration

### Vite Config

```typescript
import rsc from '@vitejs/plugin-rsc'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    rsc({
      // Entries shorthand (optional, can use environments.*.build.rollupOptions.input)
      entries: {
        rsc: './src/entry/server.tsx',
        ssr: './src/entry/ssr.tsx',
        client: './src/entry/browser.tsx',
      },
      // Auto CSS injection for server components (default: enabled)
      rscCssTransform: true,
    }),
    react(), // For client HMR
  ],

  environments: {
    rsc: {
      build: {
        outDir: 'dist/rsc',
        rollupOptions: { input: { index: './src/entry/server.tsx' } },
      },
    },
    ssr: {
      build: {
        outDir: 'dist/server',
        rollupOptions: { input: { index: './src/entry/ssr.tsx' } },
      },
    },
    client: {
      build: {
        outDir: 'dist/client',
        rollupOptions: { input: { index: './src/entry/browser.tsx' } },
      },
    },
  },
})
```

---

## Migration Steps

### Phase 1: Add New Dependency

1. [ ] Add `@vitejs/plugin-rsc` to dependencies
2. [ ] Add `rsc-html-stream` for RSC payload injection (if not already)

### Phase 2: Rewrite Plugin Layer

3. [ ] Rewrite `src/plugin/index.ts`:
   - Remove `rscCore` from `@hiogawa/vite-rsc/core/plugin`
   - Use `rsc()` from `@vitejs/plugin-rsc` as base
   - Keep framework-specific plugins (router, prerender, etc.)

4. [ ] Remove transform plugins:
   - Delete/simplify `src/features/client-component/plugin.ts`
   - Delete/simplify `src/features/server-action/plugin.tsx`

### Phase 3: Rewrite Entry Points

5. [ ] Rewrite `src/entry/server.tsx`:
   - Import from `@vitejs/plugin-rsc/rsc`
   - Use `import.meta.viteRsc.loadModule()` for SSR delegation

6. [ ] Rewrite `src/entry/ssr.tsx`:
   - Import from `@vitejs/plugin-rsc/ssr`
   - Use `import.meta.viteRsc.loadBootstrapScriptContent()`
   - Use `rsc-html-stream/server` for payload injection

7. [ ] Rewrite `src/entry/browser.tsx`:
   - Import from `@vitejs/plugin-rsc/browser`
   - Use `rsc-html-stream/client` for initial payload
   - Use `import.meta.hot.on('rsc:update', ...)` for HMR

### Phase 4: Update Feature Modules

8. [ ] Update `src/features/client-component/`:
   - `browser.tsx` → import from `@vitejs/plugin-rsc/browser`
   - `server.tsx` → import from `@vitejs/plugin-rsc/rsc`
   - `ssr.tsx` → import from `@vitejs/plugin-rsc/ssr`

9. [ ] Update `src/features/server-action/`:
   - Same pattern as client-component

10. [ ] Update CSS handling:
    - Remove custom CSS proxy
    - Rely on plugin's `rscCssTransform` or `import.meta.viteRsc.loadCss()`

### Phase 5: Cleanup

11. [ ] Remove `@hiogawa/vite-rsc` from dependencies
12. [ ] Delete unused utilities (`normalizeViteImportAnalysisUrl`, etc.)
13. [ ] Update TypeScript config to include `@vitejs/plugin-rsc/types`

### Phase 6: Testing

14. [ ] Run type checking
15. [ ] Run unit tests
16. [ ] Run e2e tests
17. [ ] Test dev server (HMR for server + client components)
18. [ ] Test production build
19. [ ] Test server actions (both JS-enabled and progressive enhancement)

---

## Package.json Changes

```diff
  "dependencies": {
-   "@hiogawa/vite-rsc": "^0.4.9",
+   "@vitejs/plugin-rsc": "^0.5.9",
+   "rsc-html-stream": "^0.0.3",
    "es-module-lexer": "^1.6.0",
    "fast-glob": "^3.3.3",
    "vitefu": "^1.0.5"
  }
```

---

## Architecture Comparison

### Before (with @hiogawa/vite-rsc)

```
@hiogawa/react-server
├── Plugin layer
│   ├── Core RSC plugin (from vite-rsc)
│   ├── "use client" transform (own implementation)
│   ├── "use server" transform (own implementation)
│   ├── CSS proxy (own implementation)
│   └── Framework plugins (router, prerender, etc.)
├── Entry points
│   └── Heavy integration with vite-rsc internals
└── Framework features
    └── Routing, metadata, error handling, etc.
```

### After (with @vitejs/plugin-rsc)

```
@hiogawa/react-server
├── Plugin layer
│   ├── rsc() from @vitejs/plugin-rsc (handles all RSC bundling)
│   └── Framework plugins (router, prerender, etc.)
├── Entry points
│   └── Minimal API usage (starter example pattern)
└── Framework features
    └── Routing, metadata, error handling, etc.
```

---

## Key Benefits

1. **Simpler codebase** - Remove ~500+ lines of RSC transform code
2. **Upstream maintenance** - RSC bundler bugs fixed in plugin-rsc
3. **Feature parity** - Get new RSC features automatically (e.g., `"use cache"`)
4. **Better integration** - Plugin designed for Vite ecosystem

---

## References

- Starter example: `/home/hiroshi/code/others/vite-plugin-react/packages/plugin-rsc/examples/starter`
- Plugin README: `/home/hiroshi/code/others/vite-plugin-react/packages/plugin-rsc/README.md`
- Plugin source: `/home/hiroshi/code/others/vite-plugin-react/packages/plugin-rsc/src/plugin.ts`
