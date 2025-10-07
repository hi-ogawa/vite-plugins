# How It Works

This document explains the internal architecture and implementation details of `@hiogawa/vite-plugin-fullstack`.

## Table of Contents

- [Overview](#overview)
- [Plugin Architecture](#plugin-architecture)
- [API Transform Pipeline](#api-transform-pipeline)
- [Query Import System](#query-import-system)
- [Virtual Module System](#virtual-module-system)
- [Dev Mode: CSS Collection](#dev-mode-css-collection)
- [Build Mode: Asset Manifest](#build-mode-asset-manifest)
- [Hot Module Replacement](#hot-module-replacement)
- [Implementation Details](#implementation-details)

## Overview

The plugin provides two main APIs for accessing build assets information:

1. **`import.meta.vite.assets()`** - Transform-based API for inline asset queries
2. **`?assets` query import** - Query-based API for importing asset information

Both APIs compile to the same underlying implementation:
- **Dev mode**: Dynamic CSS collection via module graph traversal
- **Build mode**: Static asset manifest generated during build

## Plugin Architecture

The plugin exports two sets of Vite plugins:

### 1. Server Handler Plugin (`serverHandlerPlugin`)

Provides a development server middleware that:
- Sets `appType: "custom"` to disable Vite's default HTML middleware
- Imports the SSR entry module at runtime
- Delegates HTTP requests to the entry's `export default { fetch }` handler

### 2. Assets Plugin (`assetsPlugin`)

The main plugin consists of multiple sub-plugins:

```
assetsPlugin()
├── fullstack:assets             - Main assets transform logic
├── fullstack:assets-query       - Handles ?assets query imports
├── fullstack/client-fallback    - Ensures client build has at least one entry
├── fullstack:patch-vite-client  - Patches Vite's HMR for SSR-injected CSS
└── fullstack:patch-vue-scope-css-hmr - Fixes Vue scoped CSS HMR
```

## API Transform Pipeline

### `import.meta.vite.assets()` Transform

The plugin transforms code containing `import.meta.vite.assets()` calls:

**Input:**
```js
// page.js
const assets = import.meta.vite.assets();
```

**Transform Steps:**

1. **Parse arguments** - Extract options from the function call:
   ```ts
   {
     import: id,              // Module to get assets for (defaults to current file)
     environment: undefined,  // Target environment (undefined = universal)
     asEntry: false,          // Whether to treat as entry point
   }
   ```

2. **Generate virtual imports** - Create import statements for each environment:
   ```js
   import __assets_abc123 from "virtual:fullstack/assets?import=/page.js&importer=/page.js&environment=client";
   import __assets_def456 from "virtual:fullstack/assets?import=/page.js&importer=/page.js&environment=ssr";
   import * as __assets_runtime from "@hiogawa/vite-plugin-fullstack/runtime";
   ```

3. **Replace call** - Replace `import.meta.vite.assets()` with:
   ```js
   const assets = (__assets_runtime.mergeAssets(__assets_abc123, __assets_def456));
   ```

4. **Client environment optimization** - On the client environment, the transform is a no-op:
   ```js
   const assets = ({ js: [], css: [] });
   ```
   This is because Vite handles preloading and CSS injection automatically for client-side code.

## Query Import System

### `?assets` Query Variations

The plugin supports three variations:

```js
// Universal route (both client and current environment)
import assets from "./page.js?assets";

// Client assets only (with entry flag for server-accessing-client case)
import assets from "./page.js?assets=client";

// Specific environment assets
import assets from "./page.js?assets=ssr";
```

### Resolution Logic

The `fullstack:assets-query` plugin intercepts `?assets` imports:

1. **Client environment**: Returns empty assets (client doesn't need this info)
   ```js
   return `\0virtual:fullstack/empty-assets`;
   ```

2. **Server environments**: Generates code based on query value:
   - `?assets=client` → Single environment import
   - `?assets=ssr` → Single environment import  
   - `?assets` → Merged client + current environment

## Virtual Module System

### Virtual Module Flow

```
Source: page.js?assets
    ↓
Resolve: \0virtual:fullstack/assets?import=/page.js&...
    ↓
Load: Call processAssetsImport()
    ↓
    ├── Dev: Return JSON.stringify(result)
    └── Build: Return __assets_manifest["ssr"]["/page.js"]
```

### `processAssetsImport()` Implementation

This core function has different behavior in dev vs build:

**Dev Mode:**
```js
{
  entry: "/@id/__x00__virtual:client-entry",  // Only for client environment
  js: [],                                      // Always empty in dev
  css: [                                       // Collected via module graph
    { href: "/src/styles.css", "data-vite-dev-id": "..." }
  ]
}
```

**Build Mode:**
```js
// Returns reference to manifest entry
__assets_manifest["ssr"]["/page.js"]
```

## Dev Mode: CSS Collection

The `collectCss()` function traverses the module graph to find all CSS dependencies:

### Algorithm

```js
async function collectCss(environment, entryId, options) {
  const visited = new Set();
  const cssIds = new Set();
  
  async function recurse(id) {
    // Skip already visited, virtual modules, and ?assets queries
    if (visited.has(id) || parseAssetsVirtual(id) || "assets" in parseIdQuery(id).query) {
      return;
    }
    visited.add(id);
    
    const mod = environment.moduleGraph.getModuleById(id);
    if (!mod) return;
    
    // Eagerly transform modules if needed (ensures CSS imports are analyzed)
    if (options.eager && !mod.transformResult) {
      await environment.transformRequest(id);
    }
    
    // Traverse imported modules
    for (const next of mod.importedModules ?? []) {
      if (isCSSRequest(next.id)) {
        if (!hasSpecialCssQuery(next.id)) {  // Skip ?url, ?inline, ?raw
          cssIds.add(next.id);
        }
      } else {
        recurse(next.id);  // Recursively collect from JS modules
      }
    }
  }
  
  await recurse(entryId);
  return { ids: [...cssIds], hrefs: [...cssIds].map(normalizeUrl) };
}
```

### Key Features

1. **Eager transformation**: By default, modules are transformed during collection to ensure all imports are discovered
2. **Special query handling**: Skips CSS with `?url`, `?inline`, `?raw` queries
3. **Circular dependency handling**: The `visited` Set prevents infinite loops
4. **Virtual module skipping**: Avoids collecting from `?assets` modules themselves

## Build Mode: Asset Manifest

### Build Process Flow

1. **Tracking Phase** (during server build):
   ```js
   // Server code references client assets
   import clientAssets from "./entry.client.js?assets=client";
   
   // Plugin tracks this in importAssetsMetaMap:
   importAssetsMetaMap["client"]["/entry.client.js"] = {
     id: "/entry.client.js",
     key: "entry.client.js",  // Relative path for machine-independent builds
     importerEnvironment: "ssr",
     isEntry: true
   };
   ```

2. **Dynamic Entry Injection** (`buildStart` hook):
   - When building the client environment, the plugin emits tracked modules as entry chunks:
   ```js
   if (environment.name === "client") {
     for (const meta of importAssetsMetaMap["client"]) {
       if (meta.isEntry) {
         this.emitFile({ type: "chunk", id: meta.id, preserveSignature: "exports-only" });
       }
     }
   }
   ```

3. **Dependency Collection** (`buildApp` hook):
   - After all environments are built, collect dependencies for each tracked module:
   ```js
   function collectAssetDeps(bundle) {
     // For each chunk, recursively collect:
     // - All imported chunks (JS dependencies)
     // - All imported CSS files (viteMetadata.importedCss)
     return { js: [...], css: [...] };
   }
   ```

4. **Manifest Generation**:
   ```js
   // __fullstack_assets_manifest.js
   export default {
     "client": {
       "entry.client.js": {
         entry: "/assets/entry.client-abc123.js",
         js: [
           { href: "/assets/chunk-def456.js" }
         ],
         css: [
           { href: "/assets/style-789xyz.css" }
         ]
       }
     },
     "ssr": {
       "page.js": {
         js: [],
         css: [
           { href: "/assets/page-style-abc.css" }
         ]
       }
     }
   };
   ```

5. **Asset Copying**:
   - CSS assets generated by server builds are copied to the client output directory
   - This ensures all CSS is served from the client's public directory

### Manifest Access at Runtime

Server code accesses the manifest via external import:

```js
// Generated virtual module
import __assets_manifest from "virtual:fullstack/assets-manifest";
export default __assets_manifest["ssr"]["page.js"];
```

During `renderChunk`, the plugin rewrites the import to a relative path:
```js
"virtual:fullstack/assets-manifest" → "./__fullstack_assets_manifest.js"
```

## Hot Module Replacement

### SSR-Injected CSS HMR

The plugin patches Vite's client-side HMR to handle CSS `<link>` tags injected by SSR:

**Problem**: Vite's HMR assumes all CSS is injected via `import`, not via SSR-rendered `<link>` tags.

**Solution** (`patchViteClientPlugin`):

```js
// Track SSR-injected links
const linkSheetsMap = new Map();
document.querySelectorAll('link[rel="stylesheet"][data-vite-dev-id]')
  .forEach((el) => {
    linkSheetsMap.set(el.getAttribute('data-vite-dev-id'), el);
  });

// Prevent Vite from injecting duplicate <style> tags
function updateStyle(id, content) {
  if (linkSheetsMap.has(id)) { return }
  // ... original Vite logic
}

// Remove SSR-injected links on HMR
function removeStyle(id) {
  const link = linkSheetsMap.get(id);
  if (link) {
    document.querySelectorAll('link[rel="stylesheet"][data-vite-dev-id]')
      .forEach((el) => {
        if (el.getAttribute('data-vite-dev-id') === id) {
          el.remove();
        }
      });
    linkSheetsMap.delete(id);
  }
  // ... original Vite logic
}
```

### Virtual Module Invalidation

The `hotUpdate` hook manually invalidates `?assets` virtual modules:

```js
hotUpdate(ctx) {
  // When a file changes, invalidate all ?assets queries for its dependents
  const mods = collectModuleDependents(ctx.modules);
  for (const mod of mods) {
    invalidateModuleById(environment, `${mod.id}?assets`);
    invalidateModuleById(environment, `${mod.id}?assets=client`);
    invalidateModuleById(environment, `${mod.id}?assets=${environment.name}`);
  }
}
```

This ensures that when CSS imports change, the assets information is recalculated.

## Implementation Details

### Client Fallback

Vite requires at least one input to build. The plugin injects a fallback entry if none exists:

```js
{
  build: {
    rollupOptions: {
      input: {
        __fallback: "virtual:fullstack/client-fallback"
      }
    }
  }
}
```

This chunk is removed in `generateBundle` to avoid polluting the output.

### Environment Configuration

The plugin automatically enables `emitAssets: true` for server environments:

```js
configEnvironment(name) {
  if (serverEnvironments.includes(name)) {
    return { build: { emitAssets: true } };
  }
}
```

This ensures CSS files are written to disk during server builds.

### Module Side Effects

Virtual `?assets` modules are marked with `moduleSideEffects: false` to prevent them from being included unnecessarily in builds.

### Machine-Independent Builds

The plugin uses relative paths for manifest keys to ensure builds are reproducible across different machines:

```js
key: path.relative(resolvedConfig.root, id)
```

This prevents absolute paths like `/home/user/project/page.js` from appearing in the output.

## Summary

The plugin works by:

1. **Transform phase**: Converting `import.meta.vite.assets()` and `?assets` imports to virtual module imports
2. **Dev mode**: Dynamically collecting CSS via module graph traversal at request time
3. **Build mode**: 
   - Tracking asset imports during server build
   - Dynamically injecting client entries
   - Generating a static manifest after all environments are built
   - Rewriting virtual imports to point to the manifest file
4. **HMR**: Patching Vite's client to handle SSR-injected CSS and invalidating virtual modules on changes

This design provides a framework-agnostic primitive for solving FOUC and asset preloading in SSR applications.
