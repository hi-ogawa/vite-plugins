# @hiogawa/node-loader-cloudflare

Use Cloudflare Workers runtime APIs via Node.js custom loaders to allow `cloudflare:workers` import seemlessly both development and deployment, such as:

```js
import { env } from "cloudflare:workers";
await env.KV.get("my-key");
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
    nodeLoaderCloudflare({
      // For SSG (Static Site Generation) or other build-time use cases,
      // you can also enable the plugin during build:
      // build: true,
    }),
  ],
});
```

Or you can directly regsiter the loader via:

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

## Example

Check out the [basic example](./examples/basic) for a complete setup with:

- Vite + Cloudflare Workers integration
- Client and server-side code
- KV namespace usage
- Full-stack counter demo

## License

MIT
