# @hiogawa/vite-plugin-fullstack

This plugin provides primitives to make building fullstack application on Vite simpler.

## Features

- Framework agnostics
- ...

## Example

```js
import { defineConfig } from "vite";
import fullstack from "@hiogawa/vite-plugin-fullstack"

export default defineConfig({
  plugins: [
    fullstack(),
  ],
  environments: {
    client: {
      build: {
        rollupOptions: {
          input: {
            index: "./src/entry.client.tsx",
          },
        },
      },
    },
    ssr: {
      build: {
        rollupOptions: {
          input: {
            index: "./src/entry.server.tsx",
          },
        },
      },
    }
  }
});
```

## Example with Nitro plugin

```js
import { defineConfig } from "vite";
import nitro from "nitro/vite"
import fullstack from "@hiogawa/vite-plugin-fullstack"

export default defineConfig({
  plugins: [
    nitro(),
    fullstack({
      serverHandler: false,
    }),
  ],
});
```

## API

TODO
- handle css on server
- access client asset on server runtime
  - js and css dependencies (e.g. modulepreload)
- cjs module runner
- request handle convention (same as nitro)
- multi platform deployment (delgate to nitro)
