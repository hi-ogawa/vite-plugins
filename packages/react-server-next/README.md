# @hiogawa/react-server-next

Alias package for [`Next.js`](https://github.com/vercel/next.js)

## usage

- Update `package.json`

```json
{
  "type": "module",
  "dependencies": {
    "@hiogawa/react-server": "latest",
    "next": "npm:@hiogawa/react-server-next@latest",
    "react": "rc",
    "react-dom": "rc",
    "react-server-dom-webpack": "rc"
  }
}
```

- Add `vite.config.ts`


```ts
import next from "next/vite";

export default {
  plugins: [next()],
};
```
