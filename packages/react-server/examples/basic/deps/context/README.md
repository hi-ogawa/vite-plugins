```jsx
// in server component

import { TestServer } from "@hiogawa/test-deps-context/server"
import { TestClient } from "@hiogawa/test-deps-context/client"

export default function Page() {
  return <TestServer><TestClient/></TestServer> // should show [ok]
}
```

```jsx
// in server component

import { TestServer } from "@hiogawa/test-deps-context/server2"
import { TestClient } from "@hiogawa/test-deps-context/client"

export default function Page() {
  return <TestServer><TestClient/></TestServer> // should show [ok]
}
```
