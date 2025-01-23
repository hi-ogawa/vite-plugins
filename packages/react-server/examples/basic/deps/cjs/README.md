```jsx
// in server component
import { TestServer } from "@hiogawa/test-dep-cjs/server"

export default function Page() {
  return <TestServer /> // should show [ok]
}
```

```jsx
// in server component
import { TestServer } from "@hiogawa/test-dep-cjs/server2"

export default function Page() {
  return <TestServer /> // should show [ok]
}
```
