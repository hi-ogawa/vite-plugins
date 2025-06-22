# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Root Package
- **Build**: `pnpm tsdown` - Build the plugin using TypeScript bundler
- **Dev**: `pnpm tsdown --sourcemap --watch src` - Watch mode for development
- **Test**: `bash scripts/test-package.sh` - Run e2e tests on basic example

### Working with Examples
All examples support these commands:
- **Dev**: `pnpm dev` - Start development server
- **Build**: `pnpm build` - Production build
- **Preview**: `pnpm preview` - Preview production build  
- **Test**: `pnpm test` - Run Playwright e2e tests

### Cloudflare Workers Examples
For CF-enabled examples (starter-cf-single, basic with wrangler.jsonc):
- **CF Dev**: `pnpm dev:cf` - Development with Cloudflare Workers
- **CF Build**: `CF_BUILD=1 pnpm build` - Build for Cloudflare
- **CF Preview**: `pnpm preview:cf` - Preview with wrangler

## Architecture Overview

This is a **React Server Components (RSC) Vite plugin** that implements a three-environment architecture:

### 1. RSC Environment (`react-server` condition)
- **Purpose**: Handles RSC stream serialization and server functions
- **Entry**: `entry.rsc.tsx` - Default export as request handler
- **Responsibilities**: Process "use server" functions, render RSC stream, delegate HTML to SSR

### 2. SSR Environment (standard conditions)  
- **Purpose**: RSC stream deserialization and traditional SSR
- **Entry**: `entry.ssr.tsx` - Exports `renderHTML` function
- **Responsibilities**: Convert RSC stream to React VDOM, render HTML, inject RSC payload

### 3. Client Environment (browser)
- **Purpose**: Client-side RSC deserialization and hydration  
- **Entry**: `entry.browser.tsx` - Hydration and navigation setup
- **Responsibilities**: Hydrate RSC payload, handle client navigation, call server functions

### Request Flow
1. Request hits RSC entry handler
2. Handle server actions if POST request
3. Render RSC stream from components
4. If HTML requested: load SSR module, deserialize RSC → HTML, inject payload
5. Return RSC stream or HTML response

## Key Development Patterns

### Plugin Configuration
The plugin uses Vite's multi-environment feature:
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [rsc({ /* options */ })],
  environments: {
    rsc: { build: { rollupOptions: { input: { index: "./entry.rsc.tsx" } } } },
    ssr: { build: { rollupOptions: { input: { index: "./entry.ssr.tsx" } } } },
    client: { build: { rollupOptions: { input: { index: "./entry.browser.tsx" } } } }
  }
})
```

### Cross-Environment APIs
Special Vite APIs for environment interaction:
- `import.meta.viteRsc.loadModule("ssr", "index")` - Load modules from other environments
- `import.meta.viteRsc.loadBootstrapScriptContent("index")` - Load script content
- `import.meta.viteRsc.loadCss()` - Load CSS dependencies

### Server Actions
Functions marked with "use server" are automatically encrypted and can be called from client components or used in forms for progressive enhancement.

### CSS Handling
- Automatic code-splitting between client and server components
- SSR injects relevant CSS into HTML
- Client deduplicates already-injected CSS
- Full HMR support for CSS changes

## Testing Approach

Uses **Playwright for e2e testing** with comprehensive scenarios:
- JavaScript-enabled and disabled testing
- HMR verification with code change simulation  
- CSS injection and module CSS testing
- Server action testing (both progressive enhancement and client calls)
- Production build verification

### Test Utilities
- `waitForHydration()` - Wait for React hydration
- `expectNoReload()` - Verify no page reload occurred
- `testNoJs()` - Test with JavaScript disabled
- `createEditor()` - Simulate file changes for HMR testing

### Test Environments
- `playwright test` - Development mode
- `E2E_PREVIEW=1 playwright test` - Preview mode
- `E2E_CF=1 playwright test` - Cloudflare Workers mode

## Framework Integration

The plugin is **framework-agnostic** and provides low-level RSC runtime APIs. Examples show integration with:
- Custom implementations (basic, starter examples)
- React Router (react-router example)
- Hono (hono example)
- Static Site Generation (ssg example)

Higher-level convenience APIs available at:
- `@hiogawa/vite-rsc/extra/rsc` - Simplified RSC handling
- `@hiogawa/vite-rsc/extra/ssr` - Simplified SSR handling
- `@hiogawa/vite-rsc/extra/browser` - Simplified client setup