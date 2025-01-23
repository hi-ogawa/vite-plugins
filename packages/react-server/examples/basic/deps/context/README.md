```jsx
// in server component

import { TestServer } from "@hiogawa/test-dep-context/server"
import { TestClient } from "@hiogawa/test-dep-context/client"

export default function Page() {
  return <TestServer><TestClient/></TestServer> // should show [ok]
}
```

```jsx
// in server component

import { TestServer } from "@hiogawa/test-dep-context/server2"
import { TestClient } from "@hiogawa/test-dep-context/client"

export default function Page() {
  return <TestServer><TestClient/></TestServer> // should show [ok]
}
```
