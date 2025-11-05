# @hiogawa/node-loader-cloudflare

Use Cloudflare Workers runtime APIs in Vite development via Node.js custom loaders and Wrangler's platform proxy.

## Features

- Import `cloudflare:workers` modules in your Vite application
- Access Cloudflare Workers runtime environment (`env`) during development
- Powered by [Wrangler's `getPlatformProxy`](https://developers.cloudflare.com/workers/wrangler/api/#getplatformproxy) for local development
- Seamless integration with Vite's dev server and build process

## Installation

```bash
npm install @hiogawa/node-loader-cloudflare wrangler
```

## Usage

### Vite Plugin

Add the plugin to your Vite configuration:

```ts
import { defineConfig } from "vite";
import nodeLoaderCloudflare from "@hiogawa/node-loader-cloudflare/vite";

export default defineConfig({
  plugins: [nodeLoaderCloudflare()],
});
```

### Importing Cloudflare Workers APIs

In your server-side code, you can now import from `cloudflare:workers`:

```ts
import { env } from "cloudflare:workers";

// Access bindings like KV, D1, R2, etc.
const value = await env.KV.get("my-key");
await env.KV.put("my-key", "my-value");
```

### TypeScript

Generate type definitions using Wrangler:

```bash
npx wrangler types
```

This creates a `worker-configuration.d.ts` file with types for your bindings.

## Example

Check out the [basic example](./examples/basic) for a complete setup with:
- Vite + Cloudflare Workers integration
- Client and server-side code
- KV namespace usage
- Full-stack counter demo

## How it works

This plugin uses Node.js [custom loaders](https://nodejs.org/api/module.html#customization-hooks) to intercept imports of `cloudflare:workers` and provide a runtime implementation during development.

1. **Node Loader Registration**: The plugin registers a custom Node.js loader that intercepts module resolution and loading
2. **Platform Proxy**: It initializes Wrangler's `getPlatformProxy()` which provides local implementations of Cloudflare Workers runtime APIs
3. **Module Interception**: When code imports `cloudflare:workers`, the loader returns a synthetic module that exposes the platform proxy's `env` object
4. **Lifecycle Management**: The loader is registered during Vite's build start and deregistered on build end to ensure proper cleanup

The actual implementation:
- Resolves `cloudflare:workers` to a virtual module
- Loads it with runtime bindings from `getPlatformProxy()`
- Cleans up resources when the dev server stops

## Configuration

The plugin uses your project's `wrangler.jsonc` or `wrangler.toml` configuration to determine available bindings. Configure your bindings there as you would for a normal Cloudflare Workers project.

## License

MIT
