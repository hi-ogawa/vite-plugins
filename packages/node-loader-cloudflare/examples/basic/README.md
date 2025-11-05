# node-loader-cloudflare basic example

A full-stack demo showcasing `@hiogawa/node-loader-cloudflare` with Vite, Hono, and Cloudflare Workers KV.

This example demonstrates:
- Client-side state management with Hono's JSX
- Server-side state persistence using Cloudflare Workers KV
- Seamless integration of `cloudflare:workers` imports in development

## Features

**Client Counter**: Browser-based state that increments/decrements locally (resets on page refresh)

**Server Counter**: Persistent state stored in Cloudflare Workers KV (persists across sessions)

## Quick Start

```sh
# Clone this example
npx giget gh:hi-ogawa/vite-plugins/packages/node-loader-cloudflare/examples/basic my-app
cd my-app

# Install dependencies
npm install

# Start development server
npm run dev
```

## Development

The example uses:
- **Vite** for build tooling and dev server
- **Hono** for server-side routing and JSX
- **@hiogawa/node-loader-cloudflare** to enable `cloudflare:workers` imports
- **Wrangler** for Cloudflare Workers platform proxy

The counter state is managed through:
```ts
import { env } from "cloudflare:workers";

// Access KV binding
await env.KV.get("count");
await env.KV.put("count", value);
```

## Deployment

Deploy to Cloudflare Workers:

```sh
# Build the application
npm run build

# Deploy with Wrangler
npx wrangler deploy
```

Configure your KV namespace in `wrangler.jsonc` before deploying.
