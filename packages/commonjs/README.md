# vite-plugin-commonjs

## Usage

```tsx
import { defineConfig } from 'vite'
import { cjsModuleRunnerPlugin } from '@hiogawa/vite-plugin-commonjs'

export default defineConfig({
  plugins: [
    cjsModuleRunnerPlugin(),
  ],
})
```

## How it works

TODO

## Limitations

- Transforming `require` into `import` changes the original resolution when `require`-ed package provides both ESM and CJS exports (i.e. dual package).
- `require` is hoisted at top and lazy loaded `require` such as `try { require(...) } catch {}` pattern won't work as intended.

## Related issues

- https://github.com/vitejs/vite/issues/14158
