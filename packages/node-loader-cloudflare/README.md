# @hiogawa/node-loader-cloudflare

Enable `cloudflare:workers` imports via Node.js custom loaders with Wrangler's platform proxy:

```js
import { env, waitUntil } from "cloudflare:workers";
await env.KV.get("some-key");
waitUntil(someTask());
```

## Installation

```bash
npm install @hiogawa/node-loader-cloudflare wrangler
```

## Usage

Add the plugin to your Vite configuration:

```ts
import { defineConfig } from "vite";
import nodeLoaderCloudflare from "@hiogawa/node-loader-cloudflare/vite";

export default defineConfig({
  plugins: [
    // see jsdoc for available options
    nodeLoaderCloudflare({
      // getPlatformProxyOptions: { ... }
      // environments: [...],
      // build: true,
      // exposeGlobals: true,
    }),
  ],
});
```

Or you can directly register the loader via:

```ts
import { registerCloudflare } from "@hiogawa/node-loader-cloudflare";
registerCloudflare();
```

## How it works

This plugin uses Node.js [custom loaders](https://nodejs.org/api/module.html#customization-hooks) to intercept imports of `cloudflare:workers` and provide a runtime implementation:

1. **Node Loader Registration**: The plugin registers a custom Node.js loader that intercepts module resolution and loading
2. **Platform Proxy**: It initializes Wrangler's [`getPlatformProxy()`](https://developers.cloudflare.com/workers/wrangler/api/#getplatformproxy) which provides local implementations of Cloudflare Workers runtime APIs
3. **Module Interception**: When code imports `cloudflare:workers`, the loader returns a synthetic module that exposes the platform proxy's `env` object
4. **Lifecycle Management**: The loader is registered during Vite's build start and deregistered on build end to ensure proper cleanup

This allows you to:

- Import `cloudflare:workers` modules in your Vite application
- Access Cloudflare Workers runtime environment (`env`) in dev server and optionally during build
- Use bindings like KV, D1, R2, etc. in your local environment
- Optionally expose Cloudflare globals like `WebSocketPair` and `caches` to `globalThis` by setting `exposeGlobals: true`

## Example

- [Basic SSR example](./examples/basic)
- [React Router RSC Framework Mode](https://github.com/hi-ogawa/vite-rsc-node-loader-cloudflare-example/)
- [Waku](https://github.com/wakujs/waku/pull/1749)

## License

MIT
