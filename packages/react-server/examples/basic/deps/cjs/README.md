```jsx
// in server component
import { TestServer } from "@hiogawa/test-dep-cjs"

export default function Page() {
  return <TestServer /> // should show [ok]
}
```
