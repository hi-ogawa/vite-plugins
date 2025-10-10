# @hiogawa/vite-plugin-import-attributes

Userland plugin to implement https://github.com/vitejs/vite/discussions/18534#discussioncomment-12078191

## example

TODO: explain

```js
// [entry.js]
import Counter from "./counter" with { island: "test" };

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
        if (attributes["island"] === "test") {
          return `\
import * as module from ${JSON.stringify(rawId)};
...
`;
        }
      },
    },
  ],
});
```
