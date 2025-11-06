# @hiogawa/vite-plugin-import-attributes

A Vite plugin that transforms [import attributes](https://github.com/tc39/proposal-import-attributes) into query parameters, enabling custom module handling based on import metadata.

This is a userland implementation of the feature discussed in https://github.com/vitejs/vite/discussions/18534#discussioncomment-12078191.

<!--
See issues on Vite:
https://github.com/vitejs/vite/issues/14674
https://github.com/vitejs/vite/issues/12140
-->

## Installation

```bash
npm install @hiogawa/vite-plugin-import-attributes
```

## Usage

The plugin transforms import statements with attributes into imports with query parameters, allowing other plugins to access and process these attributes, for example:

```js
// [entry.js]
import Counter from "./counter" with { island: "client-only" };

// [counter.js]
export function Counter() { ... }
```

```js
// [vite.config.ts]
import { defineConfig } from "vite";
import importAttributes, {
  parseImportAttributes,
} from "@hiogawa/vite-plugin-import-attributes";

export default defineConfig({
  plugins: [
    importAttributes(),
    {
      name: "island-plugin",
      load(id) {
        const { rawId, attributes } = parseImportAttributes(id);
        if (attributes["island"] === "client-only") {
          // Custom transformation based on attributes
          return ...
        }
      },
    },
  ],
});
```

## API

### `importAttributes(options?)`

The main plugin function.

#### Options

- `include`: String, RegExp, or array of patterns to include (default: all files)
- `exclude`: String, RegExp, or array of patterns to exclude (default: `/node_modules/`)

### `parseImportAttributes(id)`

Utility function to extract attributes from a transformed module ID.

#### Returns

```ts
{
  rawId: string; // Original module ID without attribute parameters
  attributes: Record<string, unknown>; // Parsed attributes object
}
```

## How It Works

1. The plugin transforms import statements with attributes:

   ```js
   // Before transformation
   import { Counter } from "./counter" with { island: "client-only" };

   // After transformation
   import { Counter } from "./counter?__attributes=%7B%22island%22%3A%22client-only%22%7D";
   ```

2. Other Vite plugins can then use `parseImportAttributes` to extract and process these attributes during module resolution or transformation.

## Example: Custom Binary Loader

Here's a complete example showing how to load binary files with a custom attribute:

```js
// [src/main.js]
import data from "./data.bin" with { type: "bytes" };

const decoded = new TextDecoder().decode(data);
console.log(decoded); // Output: hello
```

```js
// [vite.config.ts]
import { readFileSync } from "fs";
import importAttributes, {
  parseImportAttributes,
} from "@hiogawa/vite-plugin-import-attributes";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    importAttributes(),
    {
      name: "import-bytes",
      load(id) {
        const { rawId, attributes } = parseImportAttributes(id);
        if (attributes["type"] === "bytes") {
          const data = readFileSync(rawId);
          const base64 = data.toString("base64");
          return `export default (${base64ToBytes.toString()}(${JSON.stringify(base64)}));`;
        }
      },
    },
  ],
});

function base64ToBytes(str: string): Uint8Array {
  const binaryString = atob(str);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
```

See [examples/basic](./examples/basic) for a working demo.
