# @hiogawa/vite-plugin-server-dotenv

Vite plugin to load environment variables into `process.env` on the server side.

This plugin is a workaround for [vitejs/vite#17689](https://github.com/vitejs/vite/issues/17689) which ensures that environment variables are properly reloaded in dev mode.

## Installation

```bash
npm install @hiogawa/vite-plugin-server-dotenv
```

## Usage

```ts
import { defineConfig } from "vite";
import { vitePluginServerDotenv } from "@hiogawa/vite-plugin-server-dotenv";

export default defineConfig({
  plugins: [
    vitePluginServerDotenv({
      envPrefix: ["VITE_", "NEXT_PUBLIC_"],
    }),
  ],
});
```

## Options

### `envPrefix`

- Type: `string | string[]`
- Default: `["VITE_"]`

Environment variable prefixes to expose to the client. This option is passed to Vite's `config.envPrefix`.

## How it works

The plugin does two things:

1. In the `config` hook, it removes previously loaded environment variables from `process.env` to ensure Vite reloads them with new values (important for dev mode).

2. In the `configResolved` hook, it uses Vite's `loadEnv()` to load all environment variables from `.env` files and assigns them to `process.env`.

This ensures that environment variables are available in `process.env` on the server side, even in dev mode when the `.env` file changes.
