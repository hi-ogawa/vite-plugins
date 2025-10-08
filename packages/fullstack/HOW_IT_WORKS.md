# How It Works

This document explains the internal architecture and implementation details of `@hiogawa/vite-plugin-fullstack`.

## Table of Contents

- [Overview](#overview)
- [Query Import System](#query-import-system)
- [Virtual Module System](#virtual-module-system)
- [Dev Mode: CSS Collection](#dev-mode-css-collection)
- [Build Mode: Asset Manifest](#build-mode-asset-manifest)
- [Hot Module Replacement](#hot-module-replacement)

## Overview

The plugin provides a `?assets` query import API for accessing build assets information:

```js
import assets from "./page.js?assets";
import clientAssets from "./client.js?assets=client";
import ssrAssets from "./server.js?assets=ssr";
```

The implementation differs between dev and build modes:
- **Dev mode**: Dynamic CSS collection via module graph traversal
- **Build mode**: Static asset manifest generated during build

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

1. **Server environments**: Generates code based on query value:
   - `?assets=client` → Single environment import
   - `?assets=ssr` → Single environment import  
   - `?assets` → Merged client + current environment

2. **Client environment**: Returns empty assets (client doesn't need this info)
   ```js
   return `\0virtual:fullstack/empty-assets`;
   ```

## Virtual Module System

### Virtual Module Flow

When you import `page.js?assets`, the plugin resolves it to a virtual module that loads the assets information. In dev mode, it returns the CSS collected via module graph traversal. In build mode, it returns a reference to the static assets manifest.

### `processAssetsImport()` Implementation

This core function has different behavior in dev vs build:

**Dev Mode:**
```js
{
  entry: "/src/entry.client.tsx",  // Only for client environment
  js: [],                          // Always empty in dev
  css: [                           // Collected via module graph on server. Empty for `?assets=client`
    { href: "/src/styles.css", "data-vite-dev-id": "..." }
  ]
}
```

**Build Mode:**

Returns a reference to the static manifest entry (see [Build Mode: Asset Manifest](#build-mode-asset-manifest) for how the manifest is generated):

```js
__assets_manifest["ssr"]["/src/entry.client.tsx"]
// {
//   entry: "/assets/index-abc123.js",           // Entry chunk file name
//   js: [                                        // Preload chunks
//     { href: "/assets/chunk-def456.js" }
//   ],
//   css: [                                       // CSS files
//     { href: "/assets/style-789xyz.css" }
//   ]
// }
```

## Dev Mode: CSS Collection

In dev mode, the plugin traverses the module graph to find all CSS dependencies of a given entry module. It recursively visits all imported modules, collecting any CSS imports it encounters. To ensure all imports are discovered, modules are eagerly transformed if not already processed. The traversal skips special CSS queries like `?url`, `?inline`, and `?raw`, as well as virtual modules and `?assets` queries themselves to avoid circular dependencies.

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

Vite's HMR assumes all CSS is injected via `import`, not via SSR-rendered `<link>` tags. The plugin patches Vite's client-side HMR to track SSR-injected CSS links and prevent duplicate style injection. When CSS updates, it removes the old `<link>` tags with matching `data-vite-dev-id` attributes instead of trying to update them as `<style>` tags.

### Virtual Module Invalidation

When a file changes, the plugin manually invalidates all related `?assets` virtual modules for that file and its dependents. This ensures that when CSS imports change, the assets information is recalculated on the next request.

## Summary

The plugin works by:

1. **Query import system**: Providing `?assets` query imports that resolve to virtual modules
2. **Dev mode**: Dynamically collecting CSS via module graph traversal at request time
3. **Build mode**: 
   - Tracking asset imports during server build
   - Dynamically injecting client entries
   - Generating a static manifest after all environments are built
   - Rewriting virtual imports to point to the manifest file
4. **HMR**: Patching Vite's client to handle SSR-injected CSS and invalidating virtual modules on changes

This design provides a framework-agnostic primitive for solving FOUC and asset preloading in SSR applications.
