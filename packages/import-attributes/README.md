# @hiogawa/vite-plugin-import-attributes

https://github.com/vitejs/vite/discussions/18534#discussioncomment-12078191

## example

```js
import { defineConfig } from "vite";
import importAttributes from "@hiogawa/vite-plugin-import-attributes";

export default defineConfig({
  plugins: [
    importAttributes(),
    {
      name: 'browser-only',
    }
  ],
})
```
