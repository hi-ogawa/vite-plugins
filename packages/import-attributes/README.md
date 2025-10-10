# @hiogawa/vite-plugin-import-attributes

A Vite plugin that transforms [import attributes](https://github.com/tc39/proposal-import-attributes) into query parameters, enabling custom module handling based on import metadata.

This is a userland implementation of the feature discussed in https://github.com/vitejs/vite/discussions/18534#discussioncomment-12078191.

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
  getImportAttributesFromId,
} from "@hiogawa/vite-plugin-import-attributes";

export default defineConfig({
  plugins: [
    importAttributes(),
    {
      name: "island-plugin",
      load(id) {
        const { rawId, attributes } = getImportAttributesFromId(id);
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

### `getImportAttributesFromId(id)`

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

2. Other Vite plugins can then use `getImportAttributesFromId` to extract and process these attributes during module resolution or transformation.

## Use Cases

- **Island Architecture**: Conditionally hydrate components based on import attributes
- **Module Variants**: Load different implementations based on attributes
- **Build-time Optimizations**: Apply specific transformations based on import metadata
- **Framework Integration**: Extend framework capabilities with custom import semantics

## License

MIT
